import { expect, test } from "bun:test";
import { employeePayrollDefaultsSchema } from "./employeePayrollDefaultsForm";

test("payroll defaults retain decimal strings and accept zero through the database limit", () => {
  const schema = employeePayrollDefaultsSchema("Invalid amount");
  const amounts = { "1": "0", "2": "0.10", "3": "99999999.99" };
  expect(schema.parse({ amounts })).toEqual({ amounts });
  expect(schema.parse({ amounts: {} })).toEqual({ amounts: {} });
  for (const amount of [
    "-1",
    "1.001",
    "100000000",
    "1e3",
    "NaN",
    "",
    "1,000",
    "1.",
  ]) {
    expect(schema.safeParse({ amounts: { "1": amount } }).success).toBe(false);
  }
});
