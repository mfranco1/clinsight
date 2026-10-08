import { GeneralData } from "../types";
import { calculateAge } from "./date";

/** Keeps legacy age/sex fields normalized while preserving every unrelated patient field. */
export function normalizePatientAgeSex(info: GeneralData): GeneralData;
export function normalizePatientAgeSex(
  info: Partial<GeneralData>,
): Partial<GeneralData>;
export function normalizePatientAgeSex(
  info: null | undefined,
): null | undefined;
export function normalizePatientAgeSex(
  info: Partial<GeneralData> | null | undefined,
): Partial<GeneralData> | null | undefined {
  if (!info) return info;

  const data = info;
  let sex = data.sex || "";
  if (!sex && data.ageSex && data.ageSex !== "Not Recorded") {
    const parts = data.ageSex.split("/");
    if (parts.length > 1) {
      sex = parts[1].trim();
    } else {
      const match = data.ageSex?.match(/\d+\s*([a-zA-Z]+)/);
      if (match) sex = match[1].trim();
    }
  }
  if (!sex) sex = "Not Recorded";

  let age: number | undefined;
  if (data.dob && data.dob !== "Not Recorded") age = calculateAge(data.dob);
  if (age === undefined) {
    if (typeof data.age === "number") {
      age = data.age;
    } else if (data.ageSex && data.ageSex !== "Not Recorded") {
      const match = data.ageSex.match(/^(\d+)/);
      if (match) age = parseInt(match[1], 10);
    }
  }

  let ageSexString = "Not Recorded";
  if (age !== undefined && sex !== "Not Recorded") {
    ageSexString = `${age}/${sex}`;
  } else if (age !== undefined) {
    ageSexString = age.toString();
  } else if (sex !== "Not Recorded") {
    ageSexString = sex;
  } else if (data.ageSex) {
    ageSexString = data.ageSex;
  }

  return { ...info, age, sex, ageSex: ageSexString };
}
