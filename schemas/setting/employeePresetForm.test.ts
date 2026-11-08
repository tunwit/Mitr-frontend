import { expect, test } from "bun:test";
import en from "@/locales/UI/en.json";
import th from "@/locales/UI/th.json";
import { employeePresetSchema } from "./employeePresetForm";

for (const [locale, messages] of [
  ["en", en.employee_presets],
  ["th", th.employee_presets],
] as const) {
  const schema = employeePresetSchema({
    nameRequired: messages.name_required,
    nameTooLong: messages.name_too_long,
  });
  test(`${locale} preset form trims names and validates membership`, () => {
    expect(schema.parse({ name: " Team ", employeeIds: [1, 2] })).toEqual({
      name: "Team",
      employeeIds: [1, 2],
    });
    expect(schema.safeParse({ name: "Team", employeeIds: [] }).success).toBe(
      true,
    );
    for (const employeeIds of [[1, 1], [0], [-1], [1.5]]) {
      expect(schema.safeParse({ name: "Team", employeeIds }).success).toBe(
        false,
      );
    }
  });
  test(`${locale} preset form displays translated name validation`, () => {
    for (const [name, message] of [
      [" ", messages.name_required],
      ["x".repeat(101), messages.name_too_long],
    ]) {
      const result = schema.safeParse({ name, employeeIds: [] });
      expect(result.success).toBe(false);
      if (!result.success)
        expect(result.error.issues[0]?.message).toBe(message);
    }
  });
}

test("all preset UI messages are available in both languages", () => {
  expect(Object.keys(en.employee_presets).sort()).toEqual(
    Object.keys(th.employee_presets).sort(),
  );
});
