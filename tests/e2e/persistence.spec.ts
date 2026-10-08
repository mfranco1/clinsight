import { expect, test } from "@playwright/test";
import {
  legacyPatientCase,
  structuredPatientCase,
} from "../fixtures/patient-cases";

test("hydrates a legacy persisted patient case", async ({ page }) => {
  await page.addInitScript(
    (serializedCase) => {
      window.localStorage.setItem("clinsight_patients", serializedCase);
    },
    JSON.stringify([legacyPatientCase]),
  );

  await page.goto("/");

  await expect(page.getByText("Test Patient")).toBeVisible();
  await expect(page.getByText("TEST-001")).toBeVisible();
});

test("opens a structured chart and preserves its SOAP presentation", async ({
  page,
}) => {
  await page.addInitScript(
    (serializedCase) => {
      window.localStorage.setItem("clinsight_patients", serializedCase);
    },
    JSON.stringify([structuredPatientCase]),
  );

  await page.goto("/");
  await page.getByText("Test Patient").first().click();
  await expect(page.getByText("Stable test presentation.")).toBeVisible();
  await expect(page.getByText("Well appearing")).toBeVisible();
  await expect(
    page
      .locator("#soap-view-scroll-container")
      .getByText("Stable test patient"),
  ).toBeVisible();
});

test("selects order and medication statuses through the shared desktop/mobile portal menus", async ({
  page,
}) => {
  const patientWithOrders = {
    ...structuredPatientCase,
    orders: [
      {
        id: "order-portal-test",
        encounterId: "encounter-admission",
        name: "CBC",
        dateOrdered: "2026-10-07",
        targetDate: "2026-10-07",
        status: "PENDING",
        notes: "",
        category: "Lab",
      },
    ],
    medications: [
      {
        id: "med-portal-test",
        encounterId: "encounter-admission",
        drug: "Amoxicillin",
        dose: "500 mg",
        route: "oral",
        frequency: "BID",
        duration: "5 days",
        status: "ACTIVE",
        prescribedDate: "2026-10-07",
        prescribedBy: "Clinician",
      },
    ],
  };
  await page.addInitScript(
    (serializedCase) => {
      window.localStorage.setItem("clinsight_patients", serializedCase);
    },
    JSON.stringify([patientWithOrders]),
  );

  await page.goto("/");
  await page.getByText("Test Patient").first().click();
  await page.getByRole("button", { name: "Orders" }).last().click();

  await page.getByRole("button", { name: "PENDING", exact: true }).click();
  await page.getByRole("button", { name: "DONE", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "DONE" }).first(),
  ).toBeVisible();

  await page.getByRole("button", { name: "Medications", exact: true }).click();
  await page.getByRole("button", { name: "ACTIVE", exact: true }).click();
  await page.getByRole("button", { name: "HOLD", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "HOLD" }).first(),
  ).toBeVisible();

  await page.getByRole("button", { name: "Print Rx" }).click();
  await expect(
    page.getByRole("heading", { name: "Prescription" }),
  ).toBeVisible();
  await expect(page.getByText("Amoxicillin").last()).toBeVisible();
});

test("restores persisted attachment files and exports serializable attachment data", async ({
  page,
}) => {
  const patientWithAttachment = {
    ...structuredPatientCase,
    notes: [
      {
        id: "note-with-image",
        title: "Imaging note",
        content: "Image from the record",
        createdAt: "2026-08-26 10:00",
        updatedAt: "2026-08-26 10:00",
        attachments: [
          {
            file: { name: "scan.png", type: "image/png", lastModified: 123 },
            base64:
              "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/6ksAAAAASUVORK5CYII=",
            mimeType: "image/png",
          },
        ],
      },
    ],
  };
  await page.addInitScript(
    (serializedCase) => {
      window.localStorage.setItem("clinsight_patients", serializedCase);
    },
    JSON.stringify([patientWithAttachment]),
  );

  await page.goto("/");
  await page.getByText("Test Patient").first().click();
  await page.getByRole("button", { name: "Notes" }).first().click();
  await expect(page.getByText("scan.png")).toBeVisible();
  await expect(page.getByAltText("attachment")).toHaveAttribute(
    "src",
    /^blob:/,
  );

  const stored = await page.evaluate(() =>
    JSON.parse(window.localStorage.getItem("clinsight_patients") || "[]"),
  );
  expect(stored[0].notes[0].attachments[0].file).toMatchObject({
    name: "scan.png",
    type: "image/png",
  });
  expect(stored[0].notes[0].attachments[0].previewUrl).toBeUndefined();

  const downloadEvent = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download Full Record (JSON)" })
    .click();
  const download = await downloadEvent;
  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();
  const exported = JSON.parse(
    await (await import("node:fs/promises")).readFile(downloadPath!, "utf8"),
  );
  expect(exported.notes[0].attachments[0].file).toMatchObject({
    name: "scan.png",
    type: "image/png",
  });
  expect(exported.notes[0].attachments[0].previewUrl).toBeUndefined();
});

test("imports a case with image and PDF attachment data and rebuilds image previews", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Add Patient" }).first().click();
  const imageAttachment = {
    file: { name: "scan.png", type: "image/png", lastModified: 123 },
    base64:
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/6ksAAAAASUVORK5CYII=",
    mimeType: "image/png",
  };
  const pdfAttachment = {
    file: { name: "report.pdf", type: "application/pdf", lastModified: 456 },
    base64: "JVBERi0xLjQK",
    mimeType: "application/pdf",
  };
  const importCase = {
    ...structuredPatientCase,
    notes: [
      {
        id: "imported-note",
        title: "Imported note",
        content: "Files from import",
        createdAt: "2026-08-26 10:00",
        updatedAt: "2026-08-26 10:00",
        attachments: [imageAttachment, pdfAttachment],
      },
    ],
  };

  await page.locator('input[type="file"][accept=".json"]').setInputFiles({
    name: "case.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(importCase)),
  });
  await expect(page.getByText("Test Patient").first()).toBeVisible();
  await page.getByRole("button", { name: "Notes" }).first().click();
  await expect(page.getByText("scan.png")).toBeVisible();
  await expect(page.getByText("report.pdf")).toBeVisible();
  await expect(page.getByAltText("attachment")).toHaveAttribute(
    "src",
    /^blob:/,
  );
});

test("revokes attachment preview URLs after a patient is deleted", async ({
  page,
}) => {
  const patientWithAttachment = {
    ...structuredPatientCase,
    notes: [
      {
        id: "note-with-image",
        title: "Imaging note",
        content: "Image from the record",
        createdAt: "2026-08-26 10:00",
        updatedAt: "2026-08-26 10:00",
        attachments: [
          {
            file: { name: "scan.png", type: "image/png", lastModified: 123 },
            base64:
              "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/6ksAAAAASUVORK5CYII=",
            mimeType: "image/png",
          },
        ],
      },
    ],
  };
  await page.addInitScript(
    (serializedCase) => {
      window.localStorage.setItem("clinsight_patients", serializedCase);
      const originalRevoke = URL.revokeObjectURL.bind(URL);
      (window as typeof window & { __revokedUrls?: string[] }).__revokedUrls =
        [];
      URL.revokeObjectURL = (url: string) => {
        (
          window as typeof window & { __revokedUrls?: string[] }
        ).__revokedUrls?.push(url);
        originalRevoke(url);
      };
    },
    JSON.stringify([patientWithAttachment]),
  );

  await page.goto("/");
  await page.getByRole("button", { name: "Patient actions" }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("button", { name: "Delete Record" }).click();

  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as typeof window & { __revokedUrls?: string[] })
            .__revokedUrls ?? [],
      ),
    )
    .toEqual(expect.arrayContaining([expect.stringMatching(/^blob:/)]));
});
