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

/** Maps parser details to safe user-facing guidance without echoing file names. */
export const getPatientCaseImportErrorMessage = (error: unknown): string => {
  const message = error instanceof Error ? error.message : "";
  if (message.startsWith("Failed to read file:")) {
    return "A selected case file could not be read. Check the file and try again.";
  }
  if (message.startsWith("Failed to parse JSON inside file:")) {
    return "A selected case file is not valid JSON. Check the file and try again.";
  }
  if (message.startsWith("Invalid case format inside file:")) {
    return "A selected file is not a valid patient case. Choose a valid case export and try again.";
  }
  return "The selected cases could not be imported. Check the files and try again.";
};
