import { expect, test } from "bun:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import TableWithCheckBox from "./TableWIthCheckbox";

for (const selectable of [true, false]) {
  test(`shared table ${selectable ? "keeps selection" : "supports preset lists without selection"}`, () => {
    const selection = selectable
      ? {
          checked: [1],
          isChecked: () => true,
          toggle: () => {},
          checkall: () => {},
          uncheckall: () => {},
          isAllChecked: () => true,
          isSomeChecked: () => false,
          isNoneChecked: () => false,
        }
      : undefined;
    const props = {
      columns: [{ key: "name", label: "Name" }],
      isSuccess: true,
      isLoading: false,
      editColumn: false,
      checkboxMethods: selection,
    };
    const html = renderToStaticMarkup(
      <TableWithCheckBox
        {...props}
        data={[{ id: 1, name: "Morning team" }]}
        tableLabel="Presets"
      />,
    );
    expect(html).toContain('aria-label="Presets"');
    expect(html).toContain("Morning team");
    expect(html.match(/type="checkbox"/g)?.length ?? 0).toBe(
      selectable ? 2 : 0,
    );
    const empty = renderToStaticMarkup(
      <TableWithCheckBox<{ id: number; name: string }>
        {...props}
        data={[]}
        emptyLabel="No presets"
      />,
    );
    expect(empty).toContain(`colSpan="${selectable ? 2 : 1}"`);
    expect(empty).toContain("No presets");
  });
}
