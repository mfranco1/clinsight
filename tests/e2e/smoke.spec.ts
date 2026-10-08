import { expect, test } from "./fixtures";

test("loads the dashboard shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("No active patients")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add Patient" }).first(),
  ).toBeVisible();
  await expect(page).toHaveScreenshot("dashboard-shell.png", {
    fullPage: true,
  });
});
