import {
  ChartHistoryEntry,
  DifferentialDiagnosisItem,
  PlanItem,
} from "../types";
/**
 * Formats a list of clinical entries (ChartEntry[]) into a standardized clinical history string.
 */
export function formatChartHistory(history: ChartHistoryEntry[]): string {
  if (!history || history.length === 0) return "";

  return history
    .map((e, index) => {
      const header = `--- Entry ${index + 1} (${e.date || ""} - ${e.title || "Note"}) ---\n`;
      if (e.entryType === "raw") {
        return header + (e.rawText || "No details");
      } else if (e.soap) {
        const { subjective, objective, assessment, plan, broaderManagement } =
          e.soap;
        let entryDetails = header;

        // Subjective
        entryDetails += `SUBJECTIVE:\n`;
        if (subjective.chiefComplaint)
          entryDetails += `  Chief Complaint: ${subjective.chiefComplaint}\n`;
        entryDetails += `  HPI: ${subjective.hpi}\n`;
        if (subjective.ros)
          entryDetails += `  ROS: ${keyValueToString(subjective.ros)}\n`;
        if (subjective.pmh) entryDetails += `  PMH: ${subjective.pmh}\n`;
        if (subjective.meds)
          entryDetails += `  MEDS/ALLERGIES: ${subjective.meds}\n`;
        if (subjective.social)
          entryDetails += `  SOCIAL: ${subjective.social}\n`;
        if (subjective.anamnesis)
          entryDetails += `  ANAMNESIS: ${subjective.anamnesis}\n`;
        if (subjective.family)
          entryDetails += `  FAMILY: ${subjective.family}\n`;
        if (subjective.sexualHistory)
          entryDetails += `  SEXUAL HISTORY: ${subjective.sexualHistory}\n`;
        if (subjective.birthMaternal)
          entryDetails += `  BIRTH/MATERNAL: ${subjective.birthMaternal}\n`;
        if (subjective.immunizations)
          entryDetails += `  IMMUNIZATIONS: ${subjective.immunizations}\n`;
        if (subjective.nutrition)
          entryDetails += `  NUTRITION: ${subjective.nutrition}\n`;
        if (subjective.developmental)
          entryDetails += `  DEVELOPMENTAL: ${subjective.developmental}\n`;
        if (subjective.headsss)
          entryDetails += `  HEEADSSSS: ${keyValueToString(subjective.headsss)}\n`;

        // Objective
        entryDetails += `OBJECTIVE:\n`;
        entryDetails += `  Vitals: ${objective.vitals}\n`;
        if (objective.anthropometrics)
          entryDetails += `  Anthropometrics: ${objective.anthropometrics}\n`;
        entryDetails += `  Physical Exam: ${keyValueToString(objective.physicalExam)}\n`;
        entryDetails += `  Laboratories: ${objective.labs}\n`;
        if (objective.labInterpretation)
          entryDetails += `  Lab Interpretation: ${Array.isArray(objective.labInterpretation) ? objective.labInterpretation.join("; ") : objective.labInterpretation}\n`;
        entryDetails += `  Imaging: ${objective.imaging}\n`;
        if (objective.imagingCorrelation)
          entryDetails += `  Imaging Correlation: ${Array.isArray(objective.imagingCorrelation) ? objective.imagingCorrelation.join("; ") : objective.imagingCorrelation}\n`;

        // Assessment
        entryDetails += `ASSESSMENT:\n`;
        entryDetails += `  Diagnosis: ${assessment.summary}\n`;
        if (assessment.rationale)
          entryDetails += `  Rationale: ${Array.isArray(assessment.rationale) ? assessment.rationale.join("; ") : assessment.rationale}\n`;
        if (
          assessment.differentialDiagnosis &&
          assessment.differentialDiagnosis.length > 0
        ) {
          entryDetails += `  Differential Diagnosis:\n`;
          assessment.differentialDiagnosis.forEach(
            (dd: DifferentialDiagnosisItem) => {
              entryDetails += `    - ${dd.diagnosis}: Pro: ${dd.evidenceFor?.join(", ") || ""}; Con: ${dd.evidenceAgainst?.join(", ") || ""}\n`;
            },
          );
        }

        // Plan
        entryDetails += `PLAN:\n`;
        if (broaderManagement) {
          entryDetails += `  General Management: ${Object.entries(
            broaderManagement,
          )
            .filter(([_, v]) => v)
            .map(([k, v]) => `${k}: ${v}`)
            .join("; ")}\n`;
        }
        if (plan && plan.length > 0) {
          plan.forEach((p: PlanItem) => {
            entryDetails += `  Problem: ${p.problem}\n`;
            if (p.diagnostics?.length)
              entryDetails += `    Diagnostics: ${p.diagnostics.join(", ")}\n`;
            if (p.therapeutics?.length)
              entryDetails += `    Therapeutics: ${p.therapeutics.join(", ")}\n`;
            if (p.actions?.length)
              entryDetails += `    Actions: ${p.actions.join(", ")}\n`;
            if (p.other?.length)
              entryDetails += `    Other: ${p.other.join(", ")}\n`;
          });
        }
        return entryDetails;
      }
      return `[${e.date} - ${e.title}]: (Structured data unavailable)`;
    })
    .join("\n\n");
}

const ROS_ORDER = [
  "Constitutional",
  "HEENT",
  "Respiratory",
  "Cardiovascular",
  "Gastrointestinal",
  "Genitourinary",
  "Musculoskeletal",
  "Skin",
  "Neurological",
  "Psychiatric",
  "Endocrine",
  "Hematologic",
  "Allergic",
];

const HEEADSSSS_ORDER = [
  "Home",
  "Education",
  "Environment",
  "Eating",
  "Activities",
  "Drugs",
  "Sexuality",
  "Suicide",
  "Safety",
  "Spirituality",
];

const PHYSICAL_EXAM_ORDER = [
  "General",
  "HEENT",
  "Chest/Lungs",
  "Cardiovascular",
  "Abdomen",
  "Genitourinary",
  "Extremities",
  "Skin",
  "Neurological",
  "Psychiatric",
];

/**
 * Auto-detect the medical section type based on key overlap.
 */
function detectSectionType(
  keys: string[],
): "ros" | "headsss" | "physicalExam" | null {
  const normKeys = keys.map((k) => k.trim().toLowerCase());

  let rosCount = 0;
  let headsssCount = 0;
  let peCount = 0;

  normKeys.forEach((k) => {
    if (ROS_ORDER.map((rk) => rk.toLowerCase()).includes(k)) rosCount++;
    if (HEEADSSSS_ORDER.map((hk) => hk.toLowerCase()).includes(k))
      headsssCount++;
    if (PHYSICAL_EXAM_ORDER.map((pk) => pk.toLowerCase()).includes(k))
      peCount++;
  });

  const max = Math.max(rosCount, headsssCount, peCount);
  if (max === 0) return null;
  if (max === rosCount) return "ros";
  if (max === headsssCount) return "headsss";
  return "physicalExam";
}

/**
 * Converts a Record<string, string> (nested kv model) into a standard formatted multiline string.
 */
export function keyValueToString(
  obj: Record<string, string> | string | undefined | null,
  type?: "ros" | "headsss" | "physicalExam",
): string {
  if (!obj) return "";
  if (typeof obj === "string") return obj;

  const entries = Object.entries(obj).filter(([key, val]) => {
    if (!key) return false;
    if (val === undefined || val === null) return false;
    return true;
  });

  if (entries.length === 0) return "";

  const keys = entries.map(([key]) => key);
  const detectedType = type || detectSectionType(keys);

  let order: string[] = [];
  if (detectedType === "ros") order = ROS_ORDER;
  else if (detectedType === "headsss") order = HEEADSSSS_ORDER;
  else if (detectedType === "physicalExam") order = PHYSICAL_EXAM_ORDER;

  const sortedEntries = [...entries].sort((a, b) => {
    const keyA = a[0].trim();
    const keyB = b[0].trim();

    const idxA = order.findIndex((k) => k.toLowerCase() === keyA.toLowerCase());
    const idxB = order.findIndex((k) => k.toLowerCase() === keyB.toLowerCase());

    if (idxA > -1 && idxB > -1) return idxA - idxB;
    if (idxA > -1) return -1;
    if (idxB > -1) return 1;

    // Both are extra, sort alphabetically
    return keyA.localeCompare(keyB);
  });

  return sortedEntries
    .map(([key, val]) => {
      const cleanKey = key.trim();
      const cleanVal = String(val).trim();
      return `${cleanKey}: ${cleanVal}`;
    })
    .join("\n");
}

/**
 * Converts a multiline string (e.g., "Skin: Warm\nEyes: Normal") into a Record<string, string> object.
 * If the value is already an object, returns it as-is.
 */
export function stringToKeyValue(
  content: string | Record<string, string> | undefined | null,
): Record<string, string> {
  if (!content) return {};
  if (typeof content !== "string") return content; // already an object

  const result: Record<string, string> = {};
  const lines = content.split("\n");
  let otherCount = 0;

  lines.forEach((line) => {
    const cleanLine = line.trim().replace(/^[-*•]\s+/, "");
    if (!cleanLine) return;

    const colonIndex = cleanLine.indexOf(":");
    if (colonIndex > -1 && colonIndex < 40) {
      const key = cleanLine.substring(0, colonIndex).trim();
      const val = cleanLine.substring(colonIndex + 1).trim();
      result[key] = val;
    } else {
      otherCount++;
      const key = lines.length === 1 ? "General" : `Item ${otherCount}`;
      result[key] = cleanLine;
    }
  });
  return result;
}
