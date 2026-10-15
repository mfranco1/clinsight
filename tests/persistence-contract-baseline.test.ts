import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import {
  contractPatientCase,
  createAttachmentPatientCase,
} from "./fixtures/patient-cases";
import {
  loadPersistedPatientsWithStatus,
  migratePersistedPatients,
} from "../src/services/patientPersistence";
import {
  hydrateAttachments,
  serializeAttachments,
} from "../src/services/attachmentPersistence";
import {
  parsePatientCaseFile,
  parsePatientCaseFiles,
} from "../src/features/input/importCases";
import { usePatientStore } from "../src/hooks/usePatientStore";

const caseFile = (value: unknown) =>
  new File([JSON.stringify(value)], "synthetic.json");

describe("W01 current persistence contracts (gaps are not future acceptance rules)", () => {
  afterEach(() => vi.restoreAllMocks());

  it("preserves source, unions, optional collections, stable IDs and legacy pearls through repeat startup", () => {
    const first = migratePersistedPatients([contractPatientCase]);
    const second = migratePersistedPatients(
      JSON.parse(JSON.stringify(serializeAttachments(first))),
    );
    expect(second).toEqual(first);
    expect(second[0].entries.slice(0, 2)).toEqual(
      contractPatientCase.entries.slice(0, 2),
    );
    expect(second[0].entries[2]).toEqual({
      ...contractPatientCase.entries[2],
      encounterId: "encounter-admission",
    });
    expect(second[0].handoff.clinicalPearl).toBe("Legacy source");
    expect(second[0].orders).toBeUndefined();
    expect(second[0].medications).toBeUndefined();
    expect(second[0].notes).toEqual(contractPatientCase.notes);
  });

  it("distinguishes startup arrays, single file objects, multiple selected files, and direct handler batches", async () => {
    expect(loadPersistedPatientsWithStatus("[]")).toEqual({
      patients: [],
      error: false,
    });
    expect(
      loadPersistedPatientsWithStatus(JSON.stringify(contractPatientCase))
        .error,
    ).toBe(true);
    await expect(
      parsePatientCaseFile(caseFile(contractPatientCase)),
    ).resolves.toEqual(contractPatientCase);
    await expect(
      parsePatientCaseFile(caseFile([contractPatientCase])),
    ).rejects.toThrow("Invalid case format");
    const batch = await parsePatientCaseFiles([
      caseFile(contractPatientCase),
      caseFile({ ...contractPatientCase, id: "second" }),
    ]);
    expect(batch.map((p) => p.id)).toEqual(["legacy-17", "second"]);
    // App's internal handler hydrates directly; it does not run the startup encounter migration.
    expect(hydrateAttachments(batch)[0].entries[2].encounterId).toBeUndefined();
    const { result } = renderHook(() => usePatientStore(() => []));
    act(() => result.current.addPatients(hydrateAttachments(batch)));
    expect(result.current.patients).toHaveLength(2);
  });

  it("records the duplicate-ID gap: startup accepts duplicates and store updates/removes every match", () => {
    const duplicate = migratePersistedPatients([
      contractPatientCase,
      contractPatientCase,
    ]);
    expect(duplicate.map((p) => p.id)).toEqual(["legacy-17", "legacy-17"]);
    const { result } = renderHook(() => usePatientStore(() => duplicate));
    act(() =>
      result.current.updatePatient("legacy-17", (p) => ({
        ...p,
        references: ["changed"],
      })),
    );
    expect(
      result.current.patients.every((p) => p.references?.[0] === "changed"),
    ).toBe(true);
    act(() => result.current.removePatient("legacy-17"));
    expect(result.current.patients).toEqual([]);
  });

  it("records shallow validation gaps without tightening accepted imports", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const malformed = { ...contractPatientCase, entries: [null] };
    expect(
      loadPersistedPatientsWithStatus(JSON.stringify([malformed])),
    ).toEqual({ patients: [], error: true });
    await expect(parsePatientCaseFile(caseFile(malformed))).resolves.toEqual(
      malformed,
    );
    // Parser checks truthiness, not required nested fields or collection types.
    await expect(
      parsePatientCaseFile(caseFile({ entries: {}, course: {}, handoff: {} })),
    ).resolves.toEqual({ entries: {}, course: {}, handoff: {} });
    const missingSummary = { id: "shallow", patientInfo: {}, entries: [] };
    expect(
      loadPersistedPatientsWithStatus(JSON.stringify([missingSummary])).error,
    ).toBe(false);
  });

  it("records corrupt attachment fallback and retains successful sibling previews for their owner", () => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:restored");
    const patient = createAttachmentPatientCase();
    const stored = JSON.parse(JSON.stringify(serializeAttachments(patient)));
    stored.notes[0].attachments[0].base64 = "%%%";
    const [loaded] = migratePersistedPatients([stored]);
    expect(loaded.entries[0].attachments![0].file).toBeInstanceOf(File);
    expect(loaded.notes![0].attachments![0].file).not.toBeInstanceOf(File);
    expect(loaded.notes![0].attachments![0].base64).toBe("%%%");
    expect(loaded.entries[0].attachments![0].previewUrl).toBe("blob:restored");
  });
});
