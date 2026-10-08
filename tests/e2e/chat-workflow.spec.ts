import { expect, test } from "./fixtures";
import { structuredPatientCase } from "../fixtures/patient-cases";

test("opens and closes the clinical assistant panel", async ({ page }) => {
  await page.addInitScript(
    (serializedCase) => {
      window.localStorage.setItem("clinsight_patients", serializedCase);
    },
    JSON.stringify([structuredPatientCase]),
  );

  await page.goto("/");
  await page.getByText("Test Patient").first().click();
  await page.getByRole("button", { name: "Open Clinical Assistant" }).click();

  const heading = page.getByRole("heading", { name: "Clinical Assistant" });
  await expect(heading).toBeVisible();
  await heading.locator("xpath=../../..").getByRole("button").click();
  await expect(heading.locator("xpath=../../../..")).toHaveClass(
    /translate-x-full/,
  );
});
