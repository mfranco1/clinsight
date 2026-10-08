import type { ChartEntry, GeneralData, SoapNote } from "../../types";
import { keyValueToString } from "../../utils/clinicalText";

export const formatChartRecordForClipboard = (
  note: SoapNote,
  info: GeneralData,
  entry: ChartEntry,
): string => {
  let text = `PATIENT CHART RECORD\n`;
  text += `Entry: ${entry.title} (${entry.date})\n\n`;

  text += `GENERAL DATA\n`;
  text += `Name: ${info.patientName}\n`;
  text += `Age/Sex: ${info.ageSex}\n`;
  text += `Case No: ${info.mrn}\n`;
  text += `DOB: ${info.dob}\n`;
  text += `Admission: ${info.admissionDate}\n`;
  text += `Address: ${info.address}\n`;
  text += `Religion: ${info.religion}\n`;
  text += `Handedness: ${info.handedness}\n\n`;

  if (entry.entryType === "raw") {
    text += `MANUAL PROGRESS NOTE\n`;
    text += `${entry.rawText || entry.originalNote || "No content available."}\n\n`;

    if (!entry.soap?.assessment) {
      return text;
    }
  } else {
    text += `CLINICAL NOTE (SOAP)\n`;
    if (note.subjective.chiefComplaint)
      text += `Chief Complaint:\n${note.subjective.chiefComplaint}\n\n`;
    text += `History of Present Illness:\n${note.subjective.hpi}\n\n`;
    text += `Review of Systems:\n${keyValueToString(note.subjective.ros)}\n\n`;
    text += `Past Medical & Surgical History:\n${note.subjective.pmh}\n\n`;
    text += `Medications & Allergies:\n${note.subjective.meds}\n\n`;
    text += `Family Medical History:\n${note.subjective.family}\n\n`;
    if (note.subjective.birthMaternal)
      text += `Birth & Maternal History:\n${note.subjective.birthMaternal}\n\n`;
    if (note.subjective.immunizations)
      text += `Immunization History:\n${note.subjective.immunizations}\n\n`;
    if (note.subjective.nutrition)
      text += `Nutritional History:\n${note.subjective.nutrition}\n\n`;
    if (note.subjective.developmental)
      text += `Developmental History:\n${note.subjective.developmental}\n\n`;
    text += `Personal & Social History:\n${note.subjective.social}\n\n`;
    if (note.subjective.sexualHistory) {
      const isFemale = info.ageSex.toLowerCase().includes("f");
      text += `${isFemale ? "Sexual & OBGYN History" : "Sexual History"}:\n${note.subjective.sexualHistory}\n\n`;
    }
    if (note.subjective.anamnesis)
      text += `Anamnesis:\n${note.subjective.anamnesis}\n\n`;
    if (note.subjective.headsss)
      text += `HEADSSS Assessment:\n${keyValueToString(note.subjective.headsss)}\n\n`;

    text += `OBJECTIVE\n`;
    text += `Vitals:\n${note.objective.vitals}\n\n`;
    if (note.objective.anthropometrics)
      text += `Anthropometrics:\n${note.objective.anthropometrics}\n\n`;
    text += `Physical Examination:\n${keyValueToString(note.objective.physicalExam)}\n\n`;
    text += `Labs:\n${note.objective.labs}\n\n`;
    text += `Imaging:\n${note.objective.imaging}\n\n`;
  }

  if (note.assessment) {
    text += `ASSESSMENT\n`;
    text += `${note.assessment.summary}\n\n`;
  }

  if (note.plan) {
    text += `PLAN\n`;
    note.plan.forEach((item) => {
      text += `${item.problem}\n`;
      item.actions!.forEach((action) => (text += `- ${action}\n`));
      text += `\n`;
    });
  }

  return text;
};
