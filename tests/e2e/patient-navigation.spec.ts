import { expect, test } from "./fixtures";
import { structuredPatientCase } from "../fixtures/patient-cases";

test("patient section navigation retains patient context across views", async ({
  page,
}) => {
  const patientCaseWithLongChart = {
    ...structuredPatientCase,
    entries: structuredPatientCase.entries.map((entry) => ({
      ...entry,
      soap: {
        ...entry.soap,
        subjective: {
          ...entry.soap.subjective,
          hpi: `${entry.soap.subjective.hpi}\n\n${Array.from(
            { length: 60 },
            (_, index) =>
              `Synthetic scroll paragraph ${index + 1}. `.repeat(12),
          ).join("\n\n")}`,
        },
      },
    })),
  };
  await page.addInitScript(
    (serializedCase) => {
      window.localStorage.setItem("clinsight_patients", serializedCase);
    },
    JSON.stringify([patientCaseWithLongChart]),
  );

  await page.goto("/");
  await page.getByText("Test Patient").first().click();
  await expect(
    page
      .getByRole("paragraph")
      .filter({ hasText: "Stable test presentation." }),
  ).toBeVisible();
  const chartScrollRegion = page.locator("#soap-view-scroll-container");
  await expect
    .poll(() =>
      chartScrollRegion.evaluate(
        (element) => element.scrollHeight > element.clientHeight,
      ),
    )
    .toBe(true);
  await chartScrollRegion.evaluate((element) => {
    element.scrollTop = 120;
  });
  await expect
    .poll(() => chartScrollRegion.evaluate((element) => element.scrollTop))
    .toBe(120);

  const patientSections = page.getByRole("navigation", {
    name: "Patient sections",
  });
  const ordersTab = patientSections.getByRole("button", { name: "Orders" });
  await ordersTab.focus();
  await ordersTab.press("Enter");
  await expect(ordersTab).toHaveAttribute("aria-current", "page");
  await expect(
    page.getByRole("heading", { name: "Test Patient" }),
  ).toBeVisible();
  const ordersSearch = page.getByRole("textbox", {
    name: "Search diagnostics",
  });
  await ordersSearch.fill("round-trip query");

  const chartTab = patientSections.getByRole("button", { name: "Chart" });
  await chartTab.focus();
  await chartTab.press("Enter");
  await expect(chartTab).toHaveAttribute("aria-current", "page");
  await expect(chartTab).toBeFocused();
  await expect
    .poll(() => chartScrollRegion.evaluate((element) => element.scrollTop))
    .toBe(120);
  await expect(
    page
      .locator("#soap-view-scroll-container")
      .getByRole("paragraph")
      .filter({ hasText: "Stable test patient" }),
  ).toBeVisible();

  await ordersTab.focus();
  await ordersTab.press("Enter");
  await expect(ordersTab).toBeFocused();
  await expect(ordersSearch).toHaveValue("round-trip query");
});
