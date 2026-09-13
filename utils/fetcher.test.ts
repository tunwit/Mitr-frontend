import { afterAll, expect, mock, test } from "bun:test";

let sessionToken: string | null = "session-token";
const getToken = mock(async () => sessionToken);

mock.module("@clerk/nextjs", () => ({ getToken }));

const originalFetch = globalThis.fetch;
Object.defineProperty(globalThis, "window", {
  configurable: true,
  value: {},
});
process.env.NEXT_PUBLIC_BACKEND_URL = "https://api-mitr.iamfoodth.com";

const { fetchwithauth } = await import("./fetcher");

afterAll(() => {
  Object.defineProperty(globalThis, "fetch", {
    configurable: true,
    value: originalFetch,
  });
  Reflect.deleteProperty(globalThis, "window");
});

test("adds the Clerk session token to browser API requests", async () => {
  let requestHeaders: Headers | undefined;
  Object.defineProperty(globalThis, "fetch", {
    configurable: true,
    value: mock(async (_input: RequestInfo | URL, init?: RequestInit) => {
      requestHeaders = new Headers(init?.headers);
      return Response.json({ success: true });
    }),
  });

  await fetchwithauth({ endpoint: "/shops", method: "GET" });

  expect(getToken).toHaveBeenCalled();
  expect(requestHeaders?.get("Authorization")).toBe("Bearer session-token");
});

test("omits the authorization header when there is no Clerk session", async () => {
  sessionToken = null;
  let requestHeaders: Headers | undefined;
  Object.defineProperty(globalThis, "fetch", {
    configurable: true,
    value: mock(async (_input: RequestInfo | URL, init?: RequestInit) => {
      requestHeaders = new Headers(init?.headers);
      return Response.json({ success: true });
    }),
  });

  await fetchwithauth({ endpoint: "/shops", method: "GET" });

  expect(requestHeaders?.has("Authorization")).toBe(false);
});
