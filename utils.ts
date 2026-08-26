import { ChartEntry, GeneralData } from "./types";

/**
 * Calculates a patient's age in years based on birthdate (dob) and the current local date.
 */
export const calculateAge = (dobString: string | undefined | null): number | undefined => {
  if (!dobString || dobString.toLowerCase() === "not recorded" || dobString.toLowerCase() === "unknown") return undefined;
  try {
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return undefined;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  } catch (e) {
    return undefined;
  }
};

/**
 * Normalizes general data to ensure age and sex are set separately and ageSex is kept in sync.
 */
export const normalizePatientAgeSex = (info: any): any => {
  if (!info) return info;
  
  let sex = info.sex || '';
  if (!sex && info.ageSex && info.ageSex !== 'Not Recorded') {
    const parts = info.ageSex.split('/');
    if (parts.length > 1) {
      sex = parts[1].trim();
    } else {
      const match = info.ageSex.match(/\d+\s*([a-zA-Z]+)/);
      if (match) {
        sex = match[1].trim();
      }
    }
  }
  if (!sex) sex = 'Not Recorded';

  let age: number | undefined = undefined;
  if (info.dob && info.dob !== 'Not Recorded') {
    age = calculateAge(info.dob);
  }
  if (age === undefined) {
    if (typeof info.age === 'number') {
      age = info.age;
    } else if (info.ageSex && info.ageSex !== 'Not Recorded') {
      const match = info.ageSex.match(/^(\d+)/);
      if (match) {
        age = parseInt(match[1], 10);
      }
    }
  }

  let ageSexString = 'Not Recorded';
  if (age !== undefined && sex !== 'Not Recorded') {
    ageSexString = `${age}/${sex}`;
  } else if (age !== undefined) {
    ageSexString = age.toString();
  } else if (sex !== 'Not Recorded') {
    ageSexString = sex;
  } else if (info.ageSex) {
    ageSexString = info.ageSex;
  }

  return {
    ...info,
    age,
    sex,
    ageSex: ageSexString
  };
};

/**
 * Returns today's date as a YYYY-MM-DD string in the user's local timezone (en-CA).
 */
export const getTodayDate = (): string => {
  try {
    return new Date().toLocaleDateString('en-CA');
  } catch (e) {
    const date = new Date();
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
};

/**
 * Returns current time in 24-hour style HH:MM in the user's local timezone (en-GB).
 */
export const getCurrentTime24 = (): string => {
  try {
    return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch (e) {
    const date = new Date();
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }
};

/**
 * Returns an object with the current local date and 24-hour time parts.
 */
export const getLocalDateTimeParts = (): { date: string; time: string } => {
  return {
    date: getTodayDate(),
    time: getCurrentTime24()
  };
};

/**
 * Normalizes any string/Date input into a YYYY-MM-DD string in user's local timezone.
 */
export const normalizeDateInput = (val: string | Date | null | undefined): string => {
  if (!val) return '';
  const date = typeof val === 'string' ? new Date(val) : val;
  if (isNaN(date.getTime())) {
    if (typeof val === 'string') {
      return val.split('T')[0].split(' ')[0];
    }
    return '';
  }
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Generates a unique ID using crypto.randomUUID or standard cryptographically strong patterns, optionally prepended with a prefix.
 */
export const createId = (prefix?: string): string => {
  let uuid: string;
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    uuid = crypto.randomUUID();
  } else {
    uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
  return prefix ? `${prefix}_${uuid}` : uuid;
};

/**
 * Returns a YYYY-MM-DD string in the user's local timezone from an ISO string.
 */
export const getLocalDateString = (isoString: string): string => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString.split('T')[0];
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Returns today's date as a YYYY-MM-DD string in the user's local timezone.
 */
export const getTodayLocalDateString = (): string => {
  return getTodayDate();
};

/**
 * Formats a list of clinical entries (ChartEntry[]) into a standardized clinical history string.
 */
export function formatChartHistory(history: ChartEntry[] | any[]): string {
  if (!history || history.length === 0) return "";
  
  return history.map((e, index) => {
    const header = `--- Entry ${index + 1} (${e.date || ''} - ${e.title || 'Note'}) ---\n`;
    if (e.entryType === 'raw') {
      return header + (e.rawText || 'No details');
    } else if (e.soap) {
      const { subjective, objective, assessment, plan, broaderManagement } = e.soap;
      let entryDetails = header;
      
      // Subjective
      entryDetails += `SUBJECTIVE:\n`;
      if (subjective.chiefComplaint) entryDetails += `  Chief Complaint: ${subjective.chiefComplaint}\n`;
      entryDetails += `  HPI: ${subjective.hpi}\n`;
      if (subjective.ros) entryDetails += `  ROS: ${keyValueToString(subjective.ros)}\n`;
      if (subjective.pmh) entryDetails += `  PMH: ${subjective.pmh}\n`;
      if (subjective.meds) entryDetails += `  MEDS/ALLERGIES: ${subjective.meds}\n`;
      if (subjective.social) entryDetails += `  SOCIAL: ${subjective.social}\n`;
      if (subjective.anamnesis) entryDetails += `  ANAMNESIS: ${subjective.anamnesis}\n`;
      if (subjective.family) entryDetails += `  FAMILY: ${subjective.family}\n`;
      if (subjective.sexualHistory) entryDetails += `  SEXUAL HISTORY: ${subjective.sexualHistory}\n`;
      if (subjective.birthMaternal) entryDetails += `  BIRTH/MATERNAL: ${subjective.birthMaternal}\n`;
      if (subjective.immunizations) entryDetails += `  IMMUNIZATIONS: ${subjective.immunizations}\n`;
      if (subjective.nutrition) entryDetails += `  NUTRITION: ${subjective.nutrition}\n`;
      if (subjective.developmental) entryDetails += `  DEVELOPMENTAL: ${subjective.developmental}\n`;
      if (subjective.headsss) entryDetails += `  HEEADSSSS: ${keyValueToString(subjective.headsss)}\n`;
      
      // Objective
      entryDetails += `OBJECTIVE:\n`;
      entryDetails += `  Vitals: ${objective.vitals}\n`;
      if (objective.anthropometrics) entryDetails += `  Anthropometrics: ${objective.anthropometrics}\n`;
      entryDetails += `  Physical Exam: ${keyValueToString(objective.physicalExam)}\n`;
      entryDetails += `  Laboratories: ${objective.labs}\n`;
      if (objective.labInterpretation) entryDetails += `  Lab Interpretation: ${Array.isArray(objective.labInterpretation) ? objective.labInterpretation.join('; ') : objective.labInterpretation}\n`;
      entryDetails += `  Imaging: ${objective.imaging}\n`;
      if (objective.imagingCorrelation) entryDetails += `  Imaging Correlation: ${Array.isArray(objective.imagingCorrelation) ? objective.imagingCorrelation.join('; ') : objective.imagingCorrelation}\n`;
      
      // Assessment
      entryDetails += `ASSESSMENT:\n`;
      entryDetails += `  Diagnosis: ${assessment.summary}\n`;
      if (assessment.rationale) entryDetails += `  Rationale: ${Array.isArray(assessment.rationale) ? assessment.rationale.join('; ') : assessment.rationale}\n`;
      if (assessment.differentialDiagnosis && assessment.differentialDiagnosis.length > 0) {
        entryDetails += `  Differential Diagnosis:\n`;
        assessment.differentialDiagnosis.forEach((dd: any) => {
          entryDetails += `    - ${dd.diagnosis}: Pro: ${dd.evidenceFor?.join(', ') || ''}; Con: ${dd.evidenceAgainst?.join(', ') || ''}\n`;
        });
      }
      
      // Plan
      entryDetails += `PLAN:\n`;
      if (broaderManagement) {
        entryDetails += `  General Management: ${Object.entries(broaderManagement).filter(([_,v]) => v).map(([k,v]) => `${k}: ${v}`).join('; ')}\n`;
      }
      if (plan && plan.length > 0) {
        plan.forEach((p: any) => {
          entryDetails += `  Problem: ${p.problem}\n`;
          if (p.diagnostics?.length) entryDetails += `    Diagnostics: ${p.diagnostics.join(', ')}\n`;
          if (p.therapeutics?.length) entryDetails += `    Therapeutics: ${p.therapeutics.join(', ')}\n`;
          if (p.actions?.length) entryDetails += `    Actions: ${p.actions.join(', ')}\n`;
          if (p.other?.length) entryDetails += `    Other: ${p.other.join(', ')}\n`;
        });
      }
      return entryDetails;
    }
    return `[${e.date} - ${e.title}]: (Structured data unavailable)`;
  }).join('\n\n');
}

// Safe localStorage wrapper to prevent crash in sandboxed/third-party iframe environments
const createSafeStorage = () => {
  const mem: Record<string, string> = {};
  return {
    getItem(key: string): string | null {
      try {
        return window.localStorage.getItem(key);
      } catch (e) {
        console.warn("Storage item read error:", e);
        return mem[key] || null;
      }
    },
    setItem(key: string, value: string): void {
      try {
        window.localStorage.setItem(key, value);
      } catch (e) {
        console.warn("Storage item write error:", e);
        mem[key] = value;
      }
    },
    removeItem(key: string): void {
      try {
        window.localStorage.removeItem(key);
      } catch (e) {
        console.warn("Storage item delete error:", e);
        delete mem[key];
      }
    }
  };
};

export const safeStorage = createSafeStorage();

/**
 * Converts an array of strings (or a string) to a formatted markdown bulleted list.
 */
export const arrayToMarkdownBullets = (val: string[] | string | undefined | null): string => {
  if (!val) return "";
  if (Array.isArray(val)) {
    return val
      .map(item => item.trim())
      .filter(item => item !== "")
      .map(item => item.startsWith('-') || item.startsWith('*') ? item : `- ${item}`)
      .join('\n');
  }
  return val;
};

/**
 * Parses/splits a markdown bulleted list string into an array of clean string items.
 */
export const markdownBulletsToArray = (text: string | null | undefined): string[] => {
  if (!text) return [];
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line !== '')
    .map(line => {
      // Clean off bullet prefixes like "- ", "* ", "1. ", etc.
      return line.replace(/^([-\*\+]\s+|\d+\.\s*)/, '').trim();
    })
    .filter(line => line !== '');
};

export const ROS_ORDER = [
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
  "Allergic"
];

export const HEEADSSSS_ORDER = [
  "Home",
  "Education",
  "Environment",
  "Eating",
  "Activities",
  "Drugs",
  "Sexuality",
  "Suicide",
  "Safety",
  "Spirituality"
];

export const PHYSICAL_EXAM_ORDER = [
  "General",
  "HEENT",
  "Chest/Lungs",
  "Cardiovascular",
  "Abdomen",
  "Genitourinary",
  "Extremities",
  "Skin",
  "Neurological",
  "Psychiatric"
];

/**
 * Auto-detect the medical section type based on key overlap.
 */
function detectSectionType(keys: string[]): 'ros' | 'headsss' | 'physicalExam' | null {
  const normKeys = keys.map(k => k.trim().toLowerCase());
  
  let rosCount = 0;
  let headsssCount = 0;
  let peCount = 0;
  
  normKeys.forEach(k => {
    if (ROS_ORDER.map(rk => rk.toLowerCase()).includes(k)) rosCount++;
    if (HEEADSSSS_ORDER.map(hk => hk.toLowerCase()).includes(k)) headsssCount++;
    if (PHYSICAL_EXAM_ORDER.map(pk => pk.toLowerCase()).includes(k)) peCount++;
  });
  
  const max = Math.max(rosCount, headsssCount, peCount);
  if (max === 0) return null;
  if (max === rosCount) return 'ros';
  if (max === headsssCount) return 'headsss';
  return 'physicalExam';
}

/**
 * Converts a Record<string, string> (nested kv model) into a standard formatted multiline string.
 */
export function keyValueToString(
  obj: Record<string, string> | string | undefined | null,
  type?: 'ros' | 'headsss' | 'physicalExam'
): string {
  if (!obj) return "";
  if (typeof obj === 'string') return obj;

  const entries = Object.entries(obj).filter(([key, val]) => {
    if (!key) return false;
    if (val === undefined || val === null) return false;
    return true;
  });
  
  if (entries.length === 0) return "";
  
  const keys = entries.map(([key]) => key);
  const detectedType = type || detectSectionType(keys);
  
  let order: string[] = [];
  if (detectedType === 'ros') order = ROS_ORDER;
  else if (detectedType === 'headsss') order = HEEADSSSS_ORDER;
  else if (detectedType === 'physicalExam') order = PHYSICAL_EXAM_ORDER;
  
  const sortedEntries = [...entries].sort((a, b) => {
    const keyA = a[0].trim();
    const keyB = b[0].trim();
    
    const idxA = order.findIndex(k => k.toLowerCase() === keyA.toLowerCase());
    const idxB = order.findIndex(k => k.toLowerCase() === keyB.toLowerCase());
    
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
    .join('\n');
}

/**
 * Converts a multiline string (e.g., "Skin: Warm\nEyes: Normal") into a Record<string, string> object.
 * If the value is already an object, returns it as-is.
 */
export function stringToKeyValue(content: string | Record<string, string> | undefined | null): Record<string, string> {
  if (!content) return {};
  if (typeof content !== 'string') return content; // already an object
  
  const result: Record<string, string> = {};
  const lines = content.split('\n');
  let otherCount = 0;
  
  lines.forEach(line => {
    const cleanLine = line.trim().replace(/^[-*•]\s+/, '');
    if (!cleanLine) return;
    
    const colonIndex = cleanLine.indexOf(':');
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


