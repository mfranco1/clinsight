import { BRAND_ICON_DATA_URL } from "../../src/config/brand";
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
  await expect(page).toHaveTitle("ClinSight");
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute(
    "href",
    BRAND_ICON_DATA_URL,
  );
  await expect(page.locator(".app-bootstrap__logo")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  await page.screenshot({ path: test.info().outputPath("bootstrap.png") });
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

test("keeps brand identity accessible when the sidebar collapses", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "The sidebar is desktop-only.");
  await page.goto("/");
  await expect(
    page.locator("aside").getByText("ClinSight", { exact: true }),
  ).toBeVisible();
  await page.getByTitle("Collapse Sidebar").click();
  await expect(
    page.locator("aside").getByRole("img", { name: "ClinSight" }),
  ).toBeVisible();
  await expect
    .poll(async () => (await page.locator("aside").boundingBox())?.width)
    .toBe(80);
  await page.screenshot({
    path: test.info().outputPath("collapsed-brand.png"),
  });
  await page.getByTitle("Logout (Marty Franco)").click();
  await expect(
    page.getByRole("heading", { name: "ClinSight", exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: test.info().outputPath("login-brand.png") });
  await page.setViewportSize({ width: 393, height: 851 });
  await page.screenshot({
    path: test.info().outputPath("login-brand-mobile.png"),
  });
});
