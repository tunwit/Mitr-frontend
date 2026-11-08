import { expect, test } from "bun:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FormControl, FormLabel } from "@mui/joy";
import { NextIntlClientProvider } from "next-intl";
import { z } from "zod";
import en from "@/locales/UI/en.json";
import th from "@/locales/UI/th.json";
import { useZodForm } from "@/lib/useZodForm";
import Breadcrumbs from "./Breadcrumbs";
import { InputForm } from "./InputForm";
import { NativeInput, SearchInput, TextInput } from "./Input";

for (const [locale, messages] of [
  ["en", en],
  ["th", th],
] as const) {
  test(`${locale} breadcrumbs keep ancestor links and identify the current page`, () => {
    const html = renderToStaticMarkup(
      <NextIntlClientProvider
        locale={locale}
        messages={messages}
        timeZone="Asia/Bangkok"
      >
        <Breadcrumbs
          items={[
            { label: "Shop" },
            { label: messages.breadcrumb.payrolls, href: "/shop-10/periods" },
            {
              label: messages.employee_presets.presets,
              href: "/shop-10/presets",
            },
          ]}
        />
      </NextIntlClientProvider>,
    );
    expect(html).toContain(`aria-label="${messages.common.breadcrumbs}"`);
    expect(html).toContain(`href="/${locale}/shop-10/periods"`);
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    expect(html).not.toContain(`href="/${locale}/shop-10/presets"`);
    expect(html).toContain("text-blue-800");
  });
}

test("text inputs inherit validation state from existing form controls", () => {
  const html = renderToStaticMarkup(
    <FormControl error required>
      <FormLabel>Email</FormLabel>
      <TextInput name="email" defaultValue="invalid" />
    </FormControl>,
  );
  expect(html).toContain("MuiInput-colorDanger");
  expect(html).toContain('required=""');
  expect(html).toContain('value="invalid"');
});

test("shared form inputs retain schema-driven required and numeric input behavior", () => {
  const schema = z.object({ salary: z.number(), note: z.string().optional() });
  function Form() {
    const { control } = useZodForm(schema, {
      defaultValues: { salary: 22000, note: "" },
    });
    return (
      <>
        <InputForm
          control={control}
          name="salary"
          label="Salary"
          type="number"
        />
        <InputForm control={control} name="note" label="Note" />
      </>
    );
  }
  const html = renderToStaticMarkup(<Form />);
  const inputs = html.match(/<input\b[^>]*>/g) ?? [];
  expect(inputs[0]).toContain('type="number"');
  expect(inputs[0]).toContain('value="22000"');
  expect(inputs[0]).toContain('required=""');
  expect(inputs[1]).not.toContain('required=""');
});

test("text input errors remain visible and mark the field invalid", () => {
  const html = renderToStaticMarkup(
    <TextInput label="Email" name="email" errorMessage="Enter a valid email" />,
  );
  expect(html).toContain("Enter a valid email");
  expect(html).toContain('aria-invalid="true"');
  expect(html).toContain("font-normal text-red-500 italic");
});

test("payroll inputs preserve decimal strings and read-only presentation", () => {
  const html = renderToStaticMarkup(
    <NativeInput
      appearance="table"
      readOnly
      value="22000.10"
      aria-label="Calculated amount"
    />,
  );
  expect(html).toContain('value="22000.10"');
  expect(html).toContain('readOnly=""');
  expect(html).toContain("bg-gray-200 cursor-not-allowed");
});

test("search inputs preserve their accessible name and custom height", () => {
  const html = renderToStaticMarkup(
    <SearchInput
      placeholder="Search employees"
      className="h-6"
      defaultValue="Anan"
    />,
  );
  expect(html).toContain('aria-label="Search employees"');
  expect(html).toContain('value="Anan"');
  expect(html).toContain("h-6");
  expect(html).toContain("py-[7px]");
});
