import { expect, test } from "./fixtures";
import { structuredPatientCase } from "../fixtures/patient-cases";

test("labels chart history search and its expandable filter region", async ({
  page,
}) => {
  await page.addInitScript(
    (serializedCase) => {
      window.localStorage.setItem("clinsight_patients", serializedCase);
    },
    JSON.stringify([structuredPatientCase]),
  );

  await page.goto("/");
  await page.getByText("Test Patient").first().click();

  const isMobile = (await page.evaluate(() => window.innerWidth)) < 1024;
  if (isMobile) {
    await page.getByRole("button", { name: /^\d+ \/ \d+$/ }).click();
  }

  const search = page.getByRole("textbox", { name: "Search chart history" });
  await expect(search).toBeVisible();
  await search.fill("admission");
  await expect(search).toHaveValue("admission");

  const filters = page.getByRole("button", { name: "Filter chart history" });
  await expect(filters).toHaveAttribute("aria-expanded", "false");
  await filters.click();
  await expect(filters).toHaveAttribute("aria-expanded", "true");

  const filterRegionId = isMobile
    ? "chart-history-mobile-filters"
    : "chart-history-filters";
  await expect(filters).toHaveAttribute("aria-controls", filterRegionId);
  await expect(page.locator(`#${filterRegionId}`)).toBeVisible();
});
