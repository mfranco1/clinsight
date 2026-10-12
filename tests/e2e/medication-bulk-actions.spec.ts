import { expect, test } from "./fixtures";
import { structuredPatientCase } from "../fixtures/patient-cases";

test("medication bulk deletion stays scoped and usable at responsive widths", async ({
  page,
}) => {
  const medications = Array.from({ length: 3 }, (_, index) => ({
    id: `bulk-medication-${index + 1}`,
    encounterId: "encounter-admission",
    drug:
      index === 2
        ? "Unselected synthetic medication"
        : `Selected synthetic medication ${index + 1}`,
    dose: `${500 + index * 100} mg`,
    route: "PO",
    frequency: "BID",
    duration: "7 days",
    status: "ACTIVE",
    prescribedDate: "2026-10-12",
    prescribedBy: "Synthetic Clinician",
    notes: `Synthetic instruction ${index + 1}`,
  }));
  const patientWithMedications = {
    ...structuredPatientCase,
    medications,
  };
  await page.addInitScript(
    (serializedCase) => {
      window.localStorage.setItem("clinsight_patients", serializedCase);
    },
    JSON.stringify([patientWithMedications]),
  );

  await page.goto("/");
  await page.getByText("Test Patient").first().click();
  await page
    .getByRole("button", { name: "Orders", exact: true })
    .last()
    .click();
  await page.getByRole("button", { name: "Medications", exact: true }).click();
  await page.getByRole("button", { name: "Select", exact: true }).click();

  const firstSelection = page.getByRole("button", {
    name: "Select medication Selected synthetic medication 1",
  });
  const secondSelection = page.getByRole("button", {
    name: "Select medication Selected synthetic medication 2",
  });
  await expect(firstSelection).toBeVisible();
  await expect(secondSelection).toBeVisible();
  await firstSelection.click();
  await secondSelection.click();

  const actions = page.getByRole("group", {
    name: "Actions for selected records",
  });
  await expect(actions).toContainText("2 Meds");
  await expect(actions.getByRole("button", { name: "Group" })).toHaveCount(0);
  await actions.getByRole("button", { name: "Delete" }).click();
  await expect(
    page.getByText(/delete the 2 selected medications/i),
  ).toBeVisible();
  await page.getByRole("button", { name: "Delete", exact: true }).click();

  await expect(
    page.getByText("Selected synthetic medication 1", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Selected synthetic medication 2", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Unselected synthetic medication", { exact: true }),
  ).toBeVisible();
  const visibleDoseIndex = (page.viewportSize()?.width ?? 1280) < 768 ? 0 : 1;
  await expect(
    page.getByText("700 mg", { exact: true }).nth(visibleDoseIndex),
  ).toBeVisible();

  await expect
    .poll(() =>
      page.evaluate(() => {
        const stored = window.localStorage.getItem("clinsight_patients");
        return stored ? JSON.parse(stored)[0]?.medications : [];
      }),
    )
    .toEqual([medications[2]]);
});
