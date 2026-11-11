import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

interface FetchProps<TBody = any> {
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: TBody;
  cookie?: ReadonlyRequestCookies;
  responseType?: "json" | "blob";
}

export const publicBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

const backendUrl =
  typeof window === "undefined"
    ? process.env.INTERNAL_BACKEND_URL // server: use Docker hostname
    : publicBackendUrl; // browser: use localhost

export const fetchwithauth = async ({
  endpoint,
  method,
  body,
  cookie,
  responseType = "json",
}: FetchProps) => {
  const isFormData = body instanceof FormData;
  const cookieHeader = cookie?.toString();

  const options: RequestInit = {
    method,
    credentials: "include",
    headers: {
      ...(isFormData || method === "GET"
        ? {}
        : { "Content-Type": "application/json" }),

      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    body:
      body && method !== "GET"
        ? isFormData
          ? body
          : JSON.stringify(body)
        : undefined,
  };

  const res = await fetch(`${backendUrl}${endpoint}`, options);

  if (!res.ok) {
    let errorBody: any;

    try {
      errorBody = await res.json();
    } catch {
      errorBody = { message: await res.text() };
    }

    throw {
      status: res.status,
      code: errorBody.code ?? "UNKNOWN_ERROR",
      message: errorBody.message ?? "Request failed",
    };
  }

  if (responseType === "blob") {
    return res;
  }
  return res.json();
};

export const fetchNoAuth = async ({ endpoint, method, body }: FetchProps) => {
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (body && method !== "GET") {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(`/api${endpoint}`, options);

  return res.json();
};
