import { expect, test } from "./fixtures";

test("loads the dashboard shell", async ({ page }) => {
  const scriptRequests: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "script") {
      scriptRequests.push(new URL(request.url()).pathname);
    }
  });
  await page.goto("/");

  await expect(page.getByText("No active patients")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add Patient" }).first(),
  ).toBeVisible();
  expect(scriptRequests.join("\n")).not.toMatch(
    /ChatPanel|geminiTransport|ClinicalMarkdown|SoapView/,
  );
  await expect(page).toHaveScreenshot("dashboard-shell.png", {
    fullPage: true,
  });
});
