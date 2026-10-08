import { describe, expect, it } from "vitest";
import {
  OrderStatus,
  PatientStatus,
  type MedicalChartResponse,
} from "../src/types";
import {
  appendCourseEvent,
  prependEntry,
  prependNote,
  removeEntry,
  updateCourse,
  updateEntry,
  updateEntrySoap,
  updateHandoff,
  updateMedications,
  updateNotes,
  updateOrder,
  updateOrders,
  updatePatientInfo,
  updatePatientStatus,
  reactivateEncounter,
  withPatientId,
} from "../src/domain/patientTransitions";
import { structuredPatientCase } from "./fixtures/patient-cases";

describe("patient entry transitions", () => {
  it("updates entries immutably and preserves unrelated patient data", () => {
    const entry = structuredPatientCase.entries[0];
    const updated = updateEntry(structuredPatientCase, entry.id, {
      ...entry,
      title: "Updated",
    });

    expect(updated).not.toBe(structuredPatientCase);
    expect(updated.entries).not.toBe(structuredPatientCase.entries);
    expect(updated.patientInfo).toBe(structuredPatientCase.patientInfo);
    expect(updated.entries[0].title).toBe("Updated");
  });

  it("supports prepend, soap updates, and removal", () => {
    const entry = structuredPatientCase.entries[0];
    const prepended = prependEntry(structuredPatientCase, {
      ...entry,
      id: "new-entry",
    });
    const withSoap = updateEntrySoap(prepended, entry.id, entry.soap!);

    expect(withSoap.entries[0].id).toBe("new-entry");
    expect(removeEntry(withSoap, entry.id).entries).toHaveLength(1);
  });

  it("updates patient metadata immutably without changing unrelated fields", () => {
    const patient = structuredPatientCase as MedicalChartResponse;
    const course = [
      { date: "2026-01-02", time: "09:00", event: "Round", details: "Stable" },
    ];
    const note = {
      id: "note-2",
      title: "Follow-up",
      content: "内容",
      createdAt: "2026-01-02",
      updatedAt: "2026-01-02",
    };
    const order = {
      id: "order-2",
      name: "CBC",
      dateOrdered: "2026-01-02",
      targetDate: "2026-01-02",
      status: OrderStatus.DONE,
      notes: "",
    };
    const info = { ...patient.patientInfo, patientName: "Updated Patient" };

    expect(updatePatientInfo(patient, info).patientInfo).toBe(info);
    expect(updateCourse(patient, course).course).toBe(course);
    expect(appendCourseEvent(patient, course[0]).course).toHaveLength(
      (patient.course || []).length + 1,
    );
    expect(
      updateHandoff(patient, { ...patient.handoff, oneLiner: "Updated" })
        .entries,
    ).toBe(patient.entries);
    expect(updateOrders(patient, [order]).orders).toEqual([order]);
    expect(
      updateOrder(updateOrders(patient, [order]), {
        ...order,
        notes: "Updated",
      }).orders![0].notes,
    ).toBe("Updated");
    expect(updateMedications(patient, []).medications).toEqual([]);
    expect(updateNotes(patient, [note]).notes).toEqual([note]);
    expect(prependNote(patient, note).notes?.[0]).toBe(note);
  });

  it("transitions lifecycle state without mutating the original patient", () => {
    const patient = structuredPatientCase as MedicalChartResponse;
    const discharged = updatePatientStatus(patient, PatientStatus.DISCHARGED, {
      now: "2026-08-26T16:00:00.000Z",
      dischargeDateTime: "2026-08-26 16:00",
    });

    expect(discharged).not.toBe(patient);
    expect(discharged.encounters![0].status).toBe("COMPLETED");
    expect(patient.encounters![0].status).toBe("ACTIVE");
    expect(discharged.patientInfo.status).toBe(PatientStatus.DISCHARGED);

    const reactivated = reactivateEncounter(discharged, "encounter-admission");
    expect(reactivated.encounters![0].status).toBe("ACTIVE");
    expect(reactivated.patientInfo.status).toBe(PatientStatus.ADMITTED);
    expect(withPatientId(patient, "new-id").id).toBe("new-id");
    expect(patient.id).toBe("patient-structured");
  });
});
