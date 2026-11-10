import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import Pagination from "./Pagination";

test("pagination handles empty results, page boundaries, and loading", () => {
  const render = (page: number, totalPages: number, disabled = false) =>
    renderToStaticMarkup(
      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={() => {}}
        disabled={disabled}
      />,
    );
  const buttons = (html: string) => html.match(/<button\b[^>]*>/g) ?? [];

  expect(render(1, 0)).toBe("");
  const first = buttons(render(1, 5));
  expect(first[0]).toContain("Mui-disabled");
  expect(first[1]).toContain('aria-current="page"');
  expect(first.at(-1)).not.toContain("Mui-disabled");
  expect(first.every((button) => button.includes('type="button"'))).toBe(true);

  const last = buttons(render(5, 5));
  expect(last[0]).not.toContain("Mui-disabled");
  expect(last.at(-1)).toContain("Mui-disabled");
  expect(buttons(render(6, 5)).at(-1)).toContain("Mui-disabled");
  expect(
    buttons(render(2, 5, true)).every((button) => button.includes("Mui-disabled")),
  ).toBe(true);
});
