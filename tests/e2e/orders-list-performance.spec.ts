import { expect, test } from "./fixtures";
import { structuredPatientCase } from "../fixtures/patient-cases";

test("records interaction timing for large synthetic order and medication lists", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const rowCount = 250;
  const patientWithLargeOrderLists = {
    ...structuredPatientCase,
    orders: Array.from({ length: rowCount }, (_, index) => ({
      id: `performance-order-${index + 1}`,
      encounterId: "encounter-admission",
      name: `Synthetic diagnostic order ${index + 1}`,
      dateOrdered: "2026-10-12T08:00:00.000Z",
      targetDate: `2026-10-${String(12 + (index % 10)).padStart(2, "0")}T09:00:00.000Z`,
      status: "PENDING",
      notes: `Synthetic note ${index + 1}`,
      category: index % 2 === 0 ? "Lab" : "Imaging",
    })),
    medications: Array.from({ length: rowCount }, (_, index) => ({
      id: `performance-medication-${index + 1}`,
      encounterId: "encounter-admission",
      drug: `Synthetic medication ${index + 1}`,
      dose: "500 mg",
      route: "PO",
      frequency: "BID",
      duration: "7 days",
      status: "ACTIVE",
      prescribedDate: "2026-10-12",
      prescribedBy: "Synthetic Clinician",
      notes: `Synthetic sig ${index + 1}`,
    })),
  };
  await page.addInitScript(
    (serializedCase) => {
      window.localStorage.setItem("clinsight_patients", serializedCase);
    },
    JSON.stringify([patientWithLargeOrderLists]),
  );

  await page.goto("/");
  const navigationStart = await page.evaluate(() => performance.now());
  await page.getByText("Test Patient").first().click();
  await page.getByRole("button", { name: "Orders" }).last().click();
  await expect(
    page.getByText(`Synthetic diagnostic order ${rowCount}`, { exact: true }),
  ).toBeVisible();
  const diagnosticOpenMs = await page.evaluate(
    (start) => performance.now() - start,
    navigationStart,
  );

  const diagnosticSearch = page.getByRole("textbox", {
    name: "Search diagnostics",
  });
  const diagnosticFilterStart = await page.evaluate(() => performance.now());
  await diagnosticSearch.fill(`Synthetic diagnostic order ${rowCount}`);
  await expect(
    page.getByText(`Synthetic diagnostic order ${rowCount}`, { exact: true }),
  ).toBeVisible();
  const diagnosticFilterMs = await page.evaluate(
    (start) => performance.now() - start,
    diagnosticFilterStart,
  );

  await page.getByRole("button", { name: "Medications", exact: true }).click();
  await expect(
    page.getByText(`Synthetic medication ${rowCount}`, { exact: true }),
  ).toBeVisible();
  const medicationSearch = page.getByRole("textbox", {
    name: "Search medications",
  });
  const medicationFilterStart = await page.evaluate(() => performance.now());
  await medicationSearch.fill(`Synthetic medication ${rowCount}`);
  await expect(
    page.getByText(`Synthetic medication ${rowCount}`, { exact: true }),
  ).toBeVisible();
  const medicationFilterMs = await page.evaluate(
    (start) => performance.now() - start,
    medicationFilterStart,
  );

  console.info(
    `Operational list timings (${rowCount} rows, ${page.viewportSize()?.width}px): diagnostics open ${diagnosticOpenMs.toFixed(0)} ms, diagnostics filter ${diagnosticFilterMs.toFixed(0)} ms, medication filter ${medicationFilterMs.toFixed(0)} ms`,
  );
});
