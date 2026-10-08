import { expect, test } from "./fixtures";
import { structuredPatientCase } from "../fixtures/patient-cases";

test("opens and closes the clinical assistant panel", async ({ page }) => {
  await page.addInitScript(
    (serializedCase) => {
      window.localStorage.setItem("clinsight_patients", serializedCase);
      window.localStorage.setItem("clinsight_default_model", "legacy-model");
    },
    JSON.stringify([structuredPatientCase]),
  );

  await page.goto("/");
  await page.getByText("Test Patient").first().click();
  await page.getByRole("button", { name: "Open Clinical Assistant" }).click();

  const heading = page.getByRole("heading", { name: "Clinical Assistant" });
  await expect(heading).toBeVisible();
  await expect(page.getByText("Lite 3.5", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Flash 3.7", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Pro 3.1", { exact: true })).toHaveCount(0);
  const input = page.getByPlaceholder("Type your question...");
  await input.fill("Keep this draft while I close the panel");
  await heading.locator("xpath=../../..").getByRole("button").click();
  await expect(heading.locator("xpath=../../../..")).toHaveClass(
    /translate-x-full/,
  );
  await page.getByRole("button", { name: "Open Clinical Assistant" }).click();
  await expect(input).toHaveValue("Keep this draft while I close the panel");
});
