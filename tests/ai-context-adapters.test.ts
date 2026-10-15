import { describe, expect, it } from "vitest";
import {
  toAiPatientContext,
  toAiPatientInfo,
  toAiEntries,
  toAiSoap,
  toAiPlan,
  toAiCourse,
} from "../src/services/ai/contextAdapters";
import {
  contractPatientCase,
  createAttachmentPatientCase,
} from "./fixtures/patient-cases";
import { MedicationStatus, OrderStatus } from "../src/types";

const completePatient = () => ({
  ...createAttachmentPatientCase(),
  patientInfo: {
    ...contractPatientCase.patientInfo,
    location: "Ward",
    bloodType: "O",
    contactNumber: "Synthetic",
    email: "fixture@example.test",
    dischargeDate: "2026-10-15",
    deceasedInfo: {
      date: "2026-10-15",
      time: "09:30",
      notes: "Source",
      causeOfDeath: {
        icod: "Source",
        acod: "Source",
        ucod: "Source",
        ccod: "Source",
      },
    },
  },
  orders: [
    {
      id: "order-1",
      encounterId: "encounter-admission",
      name: "Synthetic order",
      dateOrdered: "2026-10-15",
      targetDate: "2026-10-15",
      status: OrderStatus.PENDING,
      notes: "Source",
      category: "Lab" as const,
      sortOrder: 0,
      groupId: "group-1",
      groupName: "Group",
      sourceText: "  Original 5 mg/L\n",
    },
  ],
  medications: [
    {
      id: "med-1",
      drug: "Synthetic drug",
      dose: "5 mg",
      route: "oral",
      frequency: "daily",
      duration: "1 day",
      status: MedicationStatus.ACTIVE,
      prescribedDate: "2026-10-15",
      prescribedBy: "Fixture",
      notes: "Source",
      quantity: "1",
    },
  ],
});

describe("frozen AI context projections", () => {
  it("preserves complete current context including runtime files, optional collections, legacy unions and insertion order", () => {
    const patient = completePatient();
    const projected = toAiPatientContext(patient)!;
    expect(projected).toEqual(patient);
    expect(JSON.stringify(projected)).toBe(JSON.stringify(patient));
    expect(projected.entries[0].attachments![0].file).toBe(
      patient.entries[0].attachments![0].file,
    );
    expect(toAiEntries(patient.entries)).toEqual(patient.entries);
    expect(toAiPatientInfo(patient.patientInfo)).toEqual(patient.patientInfo);
    expect(toAiCourse(patient.course)).toEqual(patient.course);
    expect(toAiPatientContext(null)).toBeNull();
    expect(toAiEntries(undefined)).toBeUndefined();
  });

  it("excludes future aggregate and nested fields while retaining existing task context", () => {
    const patient = completePatient();
    const future = {
      ...patient,
      futureDomainField: "private future value",
      patientInfo: {
        ...patient.patientInfo,
        futureDomainField: "private future value",
      },
      entries: patient.entries.map((entry) => ({
        ...entry,
        futureDomainField: "private future value",
        ...(entry.soap
          ? {
              soap: {
                ...entry.soap,
                futureDomainField: "private future value",
                subjective: {
                  ...entry.soap.subjective,
                  futureDomainField: "private future value",
                },
              },
            }
          : {}),
      })),
      notes: patient.notes!.map((note) => ({
        ...note,
        futureDomainField: "private future value",
        subNotes: note.subNotes!.map((sub) => ({
          ...sub,
          futureDomainField: "private future value",
        })),
      })),
    };
    expect(toAiPatientContext(future)).toEqual(toAiPatientContext(patient));
    expect(JSON.stringify(toAiPatientContext(future))).not.toContain(
      "private future value",
    );
    expect(toAiPatientInfo(future.patientInfo)).toEqual(patient.patientInfo);
    expect(toAiEntries(future.entries)).toEqual(patient.entries);
    expect(toAiSoap(future.entries[0].soap!)).toEqual(patient.entries[0].soap);
    const plan = [
      {
        problem: "Synthetic problem",
        actions: ["Review"],
        futureDomainField: "private future value",
      },
    ];
    expect(toAiPlan(plan)).toEqual([
      { problem: "Synthetic problem", actions: ["Review"] },
    ]);
  });
});
