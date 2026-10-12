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
  const panelId = await heading.evaluate(
    (element) => element.closest('[role="dialog"]')?.id,
  );
  if (!panelId)
    throw new Error("The clinical assistant panel needs a dialog ID");
  const panel = page.locator(`[id="${panelId}"]`);
  await expect(panel).toHaveAttribute("aria-modal", "false");
  await expect(page.getByText("Lite 3.5", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Flash 3.7", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Pro 3.1", { exact: true })).toHaveCount(0);
  const input = page.getByPlaceholder("Type your question...");
  await input.fill("Keep this draft while I close the panel");
  await page.getByRole("button", { name: "Close Clinical Assistant" }).click();
  await expect(panel).toHaveAttribute("aria-hidden", "true");
  await expect
    .poll(() =>
      input.evaluate((element) => Boolean(element.closest("[inert]"))),
    )
    .toBe(true);
  await expect(input).toHaveValue("Keep this draft while I close the panel");

  await page.getByRole("button", { name: "Open Clinical Assistant" }).click();
  await expect(panel).toHaveAttribute("aria-hidden", "false");
  await expect
    .poll(() =>
      input.evaluate((element) => Boolean(element.closest("[inert]"))),
    )
    .toBe(false);
  await expect(input).toHaveValue("Keep this draft while I close the panel");

  await page.getByRole("button", { name: "Attachments" }).click();
  await page.getByRole("menuitem", { name: "Camera" }).click();
  const cameraDialog = page.getByRole("dialog", {
    name: "Capture Attachment",
  });
  await expect(cameraDialog).toBeVisible();
  await expect(cameraDialog).toHaveAttribute("aria-modal", "true");
  await expect(panel).toHaveAttribute("aria-hidden", "true");
  await page.getByRole("button", { name: "Close modal" }).click();
  await expect(cameraDialog).toHaveCount(0);
  await expect(panel).not.toHaveAttribute("aria-hidden", "true");
  await expect(panel).toHaveAttribute("aria-modal", "false");
  await expect(heading).toBeVisible();
  await expect(input).toHaveValue("Keep this draft while I close the panel");
});
