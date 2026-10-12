import { expect, test } from "./fixtures";
import { structuredPatientCase } from "../fixtures/patient-cases";

test("keeps orders bulk actions above navigation and the final row", async ({
  page,
}) => {
  const patientWithOrders = {
    ...structuredPatientCase,
    orders: Array.from({ length: 6 }, (_, index) => ({
      id: `bottom-action-order-${index + 1}`,
      encounterId: "encounter-admission",
      name: `Synthetic imaging order ${index + 1}`,
      dateOrdered: "2026-10-07",
      targetDate: `2026-10-${String(7 + index).padStart(2, "0")}`,
      status: "PENDING",
      notes: "",
      category: "Imaging",
    })),
  };
  await page.addInitScript(
    (serializedCase) => {
      window.localStorage.setItem("clinsight_patients", serializedCase);
    },
    JSON.stringify([patientWithOrders]),
  );

  await page.goto("/");
  await page.getByText("Test Patient").first().click();
  await page
    .getByRole("button", { name: "Orders", exact: true })
    .last()
    .click();
  await page.getByRole("button", { name: "Select", exact: true }).click();
  await page
    .getByRole("button", { name: "Select order Synthetic imaging order 1" })
    .click();
  await page
    .getByRole("button", { name: "Select order Synthetic imaging order 2" })
    .click();
  await page
    .getByRole("button", { name: "Select order Synthetic imaging order 3" })
    .click();

  await page
    .getByRole("button", {
      name: "Delete order Synthetic imaging order 1",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Delete Order", exact: true }).click();

  const actionGroup = page.getByRole("group", {
    name: "Actions for selected records",
  });
  await expect(actionGroup).toContainText("2 Orders");
  const finalOrderName = page.getByText("Synthetic imaging order 6", {
    exact: true,
  });
  await expect(actionGroup).toBeVisible();
  await page
    .locator("main")
    .evaluate((main) =>
      main.scrollTo({ top: main.scrollHeight, behavior: "instant" }),
    );

  await expect
    .poll(async () => {
      const actionRect = await actionGroup.boundingBox();
      const orderRect = await finalOrderName.boundingBox();
      return Boolean(
        actionRect &&
        orderRect &&
        orderRect.y + orderRect.height <= actionRect.y + 1,
      );
    })
    .toBe(true);

  if ((await page.evaluate(() => window.innerWidth)) < 768) {
    const mobileNav = page.locator('nav[class~="md:hidden"]');
    await expect(mobileNav).toBeVisible();
    await expect
      .poll(async () => {
        const actionRect = await actionGroup.boundingBox();
        const navRect = await mobileNav.boundingBox();
        return Boolean(
          actionRect &&
          navRect &&
          actionRect.y + actionRect.height <= navRect.y,
        );
      })
      .toBe(true);

    for (const viewport of [
      { width: 667, height: 375 },
      { width: 393, height: 500 },
    ]) {
      await page.setViewportSize(viewport);
      await page
        .locator("main")
        .evaluate((main) =>
          main.scrollTo({ top: main.scrollHeight, behavior: "instant" }),
        );
      await expect
        .poll(async () => {
          const actionRect = await actionGroup.boundingBox();
          const orderRect = await finalOrderName.boundingBox();
          const navRect = await mobileNav.boundingBox();
          return Boolean(
            actionRect &&
            orderRect &&
            navRect &&
            orderRect.y + orderRect.height <= actionRect.y + 1 &&
            actionRect.y + actionRect.height <= navRect.y,
          );
        })
        .toBe(true);
    }
  }
});
