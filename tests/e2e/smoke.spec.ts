import { expect, test } from "./fixtures";

test("shows the branded bootstrap screen while the app bundle is pending", async ({
  page,
}) => {
  let releaseBundle!: () => void;
  const bundleGate = new Promise<void>((resolve) => {
    releaseBundle = resolve;
  });
  await page.route("**/assets/index-*.js", async (route) => {
    await bundleGate;
    await route.continue();
  });

  const navigation = page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("status")).toHaveText("Loading ClinSight…");
  releaseBundle();
  await navigation;
  await expect(page.getByText("No active patients")).toBeVisible();
});

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
