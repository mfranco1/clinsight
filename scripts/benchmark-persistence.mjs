/** Offline synthetic baseline. No profile, app origin, localStorage or provider access. */
import { build } from "esbuild";
import { chromium } from "@playwright/test";
import os from "node:os";
const bundle = await build({
  stdin: {
    contents: `import { structuredPatientCase } from './tests/fixtures/patient-cases';
import { loadPersistedPatients } from './src/services/patientPersistence';
import { serializeAttachments, collectAttachmentPreviewUrls } from './src/services/attachmentPersistence';
globalThis.persistenceBaseline = { structuredPatientCase, loadPersistedPatients, serializeAttachments, collectAttachmentPreviewUrls };`,
    resolveDir: process.cwd(),
  },
  bundle: true,
  write: false,
  format: "iife",
  platform: "browser",
});
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  // Blank, isolated context. Benchmark cannot read or overwrite patient storage.
  await page.route("**/*", (route) => route.abort());
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  const results = await page.evaluate(() => {
    const {
      structuredPatientCase,
      loadPersistedPatients,
      serializeAttachments,
      collectAttachmentPreviewUrls,
    } = globalThis.persistenceBaseline;
    const summarize = (values) => {
      values.sort((a, b) => a - b);
      return {
        medianMs: values[Math.floor(values.length / 2)],
        p95Ms: values[Math.ceil(values.length * 0.95) - 1],
      };
    };
    const workloads = [
      { patients: 10, attachmentBytes: 0 },
      { patients: 100, attachmentBytes: 0 },
      { patients: 10, attachmentBytes: 65536 },
    ];
    return workloads.map((workload) => {
      const patients = Array.from({ length: workload.patients }, (_, index) => {
        const p = structuredClone(structuredPatientCase);
        p.id = `synthetic-${index}`;
        p.handoff.patientId = p.id;
        p.entries = Array.from({ length: 20 }, (_, entry) => ({
          ...structuredClone(p.entries[0]),
          id: `entry-${index}-${entry}`,
          originalNote:
            `Synthetic source ${entry}: 5 mg/L\n` +
            "Stable synthetic narrative. ".repeat(40),
        }));
        if (workload.attachmentBytes)
          p.entries[0].attachments = [
            {
              file: {
                name: "synthetic.bin",
                type: "application/octet-stream",
                lastModified: 123,
              },
              base64: btoa("a".repeat(workload.attachmentBytes)),
              mimeType: "application/octet-stream",
              category: "Imaging",
            },
          ];
        return p;
      });
      const source = JSON.stringify(patients);
      const hydration = [],
        serialization = [];
      let oneEditBytes = 0;
      for (let sample = -5; sample < 30; sample++) {
        const start = performance.now();
        const runtime = loadPersistedPatients(source);
        const hydrated = performance.now();
        runtime[0].entries[0].title = "Edited synthetic note";
        const written = JSON.stringify(serializeAttachments(runtime));
        const serialized = performance.now();
        oneEditBytes = new TextEncoder().encode(written).length;
        collectAttachmentPreviewUrls(runtime).forEach((url) =>
          URL.revokeObjectURL(url),
        );
        if (sample >= 0) {
          hydration.push(hydrated - start);
          serialization.push(serialized - hydrated);
        }
      }
      return {
        ...workload,
        entriesPerPatient: 20,
        sourceUtf8Bytes: new TextEncoder().encode(source).length,
        sourceUtf16Bytes: source.length * 2,
        attachmentTotalRawBytes: workload.patients * workload.attachmentBytes,
        attachmentTotalBase64Chars:
          workload.patients *
          (workload.attachmentBytes
            ? 4 * Math.ceil(workload.attachmentBytes / 3)
            : 0),
        oneEditUtf8Bytes: oneEditBytes,
        hydration: summarize(hydration),
        serialization: summarize(serialization),
      };
    });
  });
  console.log(
    JSON.stringify(
      {
        machine: {
          platform: os.platform(),
          release: os.release(),
          arch: os.arch(),
          cpu: os.cpus()[0].model,
          logicalCpus: os.cpus().length,
          memoryGiB: os.totalmem() / 2 ** 30,
        },
        browser: await browser.version(),
        warmup: 5,
        samples: 30,
        units:
          "ms; hydration includes JSON parse/migrate/hydrate; serialization includes one title edit + recursive serialization + stringify; write volume only, no storage write",
        results,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
