import { expect, test } from "./fixtures";
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
  await expect(
    page.getByRole("paragraph").filter({
      hasText: "Stable test presentation.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("paragraph").filter({ hasText: "Well appearing" }),
  ).toBeVisible();
  await expect(
    page
      .locator("#soap-view-scroll-container")
      .getByRole("paragraph")
      .filter({ hasText: "Stable test patient" }),
  ).toBeVisible();
});

test("switches source and visual modes without rewriting an untouched patient note", async ({
  page,
}) => {
  const original = "## Clinical note\n\nVitals remain **stable**.";
  const patientWithNote = {
    ...structuredPatientCase,
    notes: [
      {
        id: "note-editor-round-trip",
        title: "Editor round trip",
        content: original,
        createdAt: "2026-08-26 09:00",
        updatedAt: "2026-08-26 09:00",
      },
    ],
  };
  await page.addInitScript(
    (serializedCase) => {
      window.localStorage.setItem("clinsight_patients", serializedCase);
    },
    JSON.stringify([patientWithNote]),
  );

  await page.goto("/");
  await page.getByText("Test Patient").first().click();
  await page.getByRole("button", { name: "Notes" }).last().click();
  await page.getByRole("button", { name: "Edit Note" }).click();
  const editor = page.getByRole("textbox", {
    name: "Start typing your note here... (Supports Markdown and LaTeX)",
  });
  await expect(editor).toContainText("Vitals remain");

  await page.getByRole("button", { name: /source/i }).click();
  await expect(page.getByTestId("source-text-editor")).toContainText(
    "## Clinical note",
  );
  await page.getByRole("button", { name: /visual/i }).click();
  await expect(editor).toContainText("Vitals remain");
  await page.getByRole("button", { name: "Save" }).click();

  await expect
    .poll(() =>
      page.evaluate(() => {
        const records = JSON.parse(
          window.localStorage.getItem("clinsight_patients") || "[]",
        );
        return records[0]?.notes[0]?.content;
      }),
    )
    .toBe(original);
});

test("applies visual formatting and reflects it in Markdown source", async ({
  page,
}) => {
  const patientWithNote = {
    ...structuredPatientCase,
    notes: [
      {
        id: "note-editor-formatting",
        title: "Editor formatting",
        content: "Vitals remain stable.",
        createdAt: "2026-08-26 09:00",
        updatedAt: "2026-08-26 09:00",
      },
    ],
  };
  await page.addInitScript(
    (serializedCase) => {
      window.localStorage.setItem("clinsight_patients", serializedCase);
    },
    JSON.stringify([patientWithNote]),
  );

  await page.goto("/");
  await page.getByText("Test Patient").first().click();
  await page.getByRole("button", { name: "Notes" }).last().click();
  await page.getByRole("button", { name: "Edit Note" }).click();
  const editor = page.getByRole("textbox", {
    name: "Start typing your note here... (Supports Markdown and LaTeX)",
  });
  await expect(editor).toContainText("Vitals remain stable.");
  const selectionBounds = await editor.locator("p").evaluate((paragraph) => {
    const text = paragraph.firstChild;
    if (!text || text.nodeType !== Node.TEXT_NODE) {
      throw new Error("Expected a plain paragraph for the selection fixture");
    }
    const range = document.createRange();
    range.setStart(text, 14);
    range.setEnd(text, text.textContent?.length ?? 14);
    const rect = range.getBoundingClientRect();
    return {
      left: rect.left,
      right: rect.right,
      y: rect.top + rect.height / 2,
    };
  });
  await page.mouse.move(selectionBounds.left, selectionBounds.y);
  await page.mouse.down();
  await page.mouse.move(selectionBounds.right, selectionBounds.y, { steps: 5 });
  await page.mouse.up();
  await expect
    .poll(() => page.evaluate(() => window.getSelection()?.toString()))
    .toBe("stable.");
  await page.getByRole("button", { name: "Bold" }).click();
  await expect(editor.locator("strong")).toHaveText("stable.");
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(editor.locator("strong")).toHaveCount(0);
  await page.getByRole("button", { name: "Redo" }).click();
  await expect(editor.locator("strong")).toHaveText("stable.");
  await page.getByRole("button", { name: /source/i }).click();
  await expect(page.getByTestId("source-text-editor")).toContainText(
    "Vitals remain **stable.**",
  );
});

test("creates a Markdown task list from the visual editor toolbar", async ({
  page,
}) => {
  const patientWithNote = {
    ...structuredPatientCase,
    notes: [
      {
        id: "note-editor-task-list",
        title: "Editor task list",
        content: "Review plan.",
        createdAt: "2026-08-26 09:00",
        updatedAt: "2026-08-26 09:00",
      },
    ],
  };
  await page.addInitScript(
    (serializedCase) => {
      window.localStorage.setItem("clinsight_patients", serializedCase);
    },
    JSON.stringify([patientWithNote]),
  );

  await page.goto("/");
  await page.getByText("Test Patient").first().click();
  await page.getByRole("button", { name: "Notes" }).last().click();
  await page.getByRole("button", { name: "Edit Note" }).click();
  const editor = page.getByRole("textbox", {
    name: "Start typing your note here... (Supports Markdown and LaTeX)",
  });
  await editor.press("ControlOrMeta+End");
  await page.getByRole("button", { name: "Task list" }).click();
  await expect(editor.locator('input[type="checkbox"]')).toHaveCount(1);

  await page.getByRole("button", { name: /source/i }).click();
  await expect(page.getByTestId("source-text-editor")).toContainText(
    "- [ ] Review plan.",
  );
});

test("keeps visual formatting reachable in the narrow-screen toolbar", async ({
  page,
}) => {
  test.skip((page.viewportSize()?.width ?? 1280) > 600);
  const patientWithNote = {
    ...structuredPatientCase,
    notes: [
      {
        id: "note-editor-mobile-toolbar",
        title: "Mobile editor toolbar",
        content: "Clinical note.",
        createdAt: "2026-08-26 09:00",
        updatedAt: "2026-08-26 09:00",
      },
    ],
  };
  await page.addInitScript(
    (serializedCase) => {
      window.localStorage.setItem("clinsight_patients", serializedCase);
    },
    JSON.stringify([patientWithNote]),
  );

  await page.goto("/");
  await page.getByText("Test Patient").first().click();
  await page.getByRole("button", { name: "Notes" }).last().click();
  await page.getByRole("button", { name: "Edit Note" }).click();

  const toolbar = page.getByRole("toolbar", { name: "Formatting" });
  const toolbarMetrics = await toolbar.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
    overflowX: getComputedStyle(element).overflowX,
  }));
  expect(toolbarMetrics.overflowX).toBe("auto");
  expect(toolbarMetrics.scrollWidth).toBeGreaterThan(
    toolbarMetrics.clientWidth,
  );
  await expect(
    page.getByRole("group", { name: "Editor view mode" }),
  ).toBeVisible();

  const taskListButton = page.getByRole("button", { name: "Task list" });
  await taskListButton.scrollIntoViewIfNeeded();
  await taskListButton.click();
  await expect(
    page
      .getByRole("textbox", {
        name: "Start typing your note here... (Supports Markdown and LaTeX)",
      })
      .locator('input[type="checkbox"]'),
  ).toHaveCount(1);
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
  await page.addInitScript(() => {
    const parent = window as Window & { __capturedPrint?: string };
    window.open = (() => {
      const printDocument = {
        title: "",
        open: () => undefined,
        write: (html: string) => {
          parent.__capturedPrint = html;
        },
        close: () => undefined,
      };
      return { document: printDocument } as unknown as Window;
    }) as typeof window.open;
  });
  await page.goto("/");
  await page.getByText("Test Patient").first().click();
  await page.getByRole("button", { name: "Orders" }).last().click();

  await page.getByRole("combobox", { name: "PENDING" }).click();
  await page.getByRole("option", { name: "DONE", exact: true }).click();
  await expect(
    page.getByRole("combobox", { name: "DONE" }).first(),
  ).toBeVisible();

  await page.getByRole("button", { name: "Medications", exact: true }).click();
  await page.getByRole("combobox", { name: "ACTIVE" }).click();
  await page.getByRole("option", { name: "HOLD", exact: true }).click();
  await expect(
    page.getByRole("combobox", { name: "HOLD" }).first(),
  ).toBeVisible();

  await page.getByRole("button", { name: "Print Rx" }).click();
  await expect(
    page.getByRole("heading", { name: "Prescription" }),
  ).toBeVisible();
  await page.getByPlaceholder("Medication Name").fill("Amoxicillin");
  await page.getByPlaceholder("Dose").fill("500 mg");
  await page.getByRole("button", { name: "Print Rx" }).last().click();
  const printedHtml = await page.evaluate(
    () => (window as Window & { __capturedPrint?: string }).__capturedPrint,
  );
  expect(printedHtml).toContain('value="Amoxicillin"');
  expect(printedHtml).toContain("500 mg");
});

test("renders a long clinical note within the interactive budget", async ({
  page,
}) => {
  const paragraphCount = 80;
  const hpi = Array.from(
    { length: paragraphCount },
    (_, index) =>
      `Finding ${index + 1}: synthetic review remains stable at 5 mg/L; estimated rate \\(x_${index + 1} + 1\\).`,
  ).join("\n\n");
  const largeCase = {
    ...structuredPatientCase,
    entries: [
      {
        ...structuredPatientCase.entries[0],
        soap: {
          ...structuredPatientCase.entries[0].soap!,
          subjective: {
            ...structuredPatientCase.entries[0].soap!.subjective,
            hpi: `${hpi}\n\nEnd of rendered fixture marker.`,
          },
        },
      },
    ],
  };

  await page.addInitScript(
    (serializedCase) => {
      window.localStorage.setItem("clinsight_patients", serializedCase);
    },
    JSON.stringify([largeCase]),
  );
  await page.goto("/");
  const start = await page.evaluate(() => performance.now());
  await page.getByText("Test Patient").first().click();
  await expect(page.getByText("End of rendered fixture marker.")).toBeVisible();
  const elapsed = await page.evaluate(
    (startTime) => performance.now() - startTime,
    start,
  );

  expect(
    await page
      .locator("#soap-view-scroll-container")
      .getByRole("paragraph")
      .count(),
  ).toBeGreaterThanOrEqual(paragraphCount);
  expect(elapsed).toBeLessThan(10_000);
  console.info(
    `Rendered ${paragraphCount} paragraphs with inline math in ${elapsed.toFixed(0)} ms at ${page.viewportSize()?.width}px width`,
  );
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
