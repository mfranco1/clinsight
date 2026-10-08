import { MedicalChartResponse } from "../../types";

export const parsePatientCaseFile = (
  file: File,
): Promise<MedicalChartResponse> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.entries && json.course && json.handoff) {
          resolve(json as MedicalChartResponse);
        } else {
          reject(new Error(`Invalid case format inside file: ${file.name}`));
        }
      } catch {
        reject(new Error(`Failed to parse JSON inside file: ${file.name}`));
      }
    };
    reader.onerror = () =>
      reject(new Error(`Failed to read file: ${file.name}`));
    reader.readAsText(file);
  });

export const parsePatientCaseFiles = (
  files: FileList | File[],
): Promise<MedicalChartResponse[]> =>
  Promise.all(Array.from(files, parsePatientCaseFile));
