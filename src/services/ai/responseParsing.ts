import { sanitizeModelOutput } from "./geminiTransport";
import { logDiagnostic } from "../diagnosticLogger";

export const extractAndParseJSON = <T>(text: string): T => {
  if (!text) throw new Error("Empty model response.");
  const cleaned = sanitizeModelOutput(text);
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    logDiagnostic(
      "warn",
      "Structured response parsing needed extraction fallback.",
    );
    const jsonStart = cleaned.indexOf("{");
    const jsonArrayStart = cleaned.indexOf("[");
    let startIndex = -1;
    let endIndex = -1;

    if (
      jsonStart !== -1 &&
      (jsonArrayStart === -1 || jsonStart < jsonArrayStart)
    ) {
      startIndex = jsonStart;
      let bracketCount = 0;
      for (let index = startIndex; index < cleaned.length; index++) {
        if (cleaned[index] === "{") bracketCount++;
        else if (cleaned[index] === "}" && --bracketCount === 0) {
          endIndex = index;
          break;
        }
      }
    } else if (jsonArrayStart !== -1) {
      startIndex = jsonArrayStart;
      let bracketCount = 0;
      for (let index = startIndex; index < cleaned.length; index++) {
        if (cleaned[index] === "[") bracketCount++;
        else if (cleaned[index] === "]" && --bracketCount === 0) {
          endIndex = index;
          break;
        }
      }
    }

    if (startIndex !== -1 && endIndex !== -1) {
      try {
        return JSON.parse(cleaned.substring(startIndex, endIndex + 1)) as T;
      } catch {
        logDiagnostic("error", "Extracted structured response was invalid.");
        throw new Error(
          "Invalid structured JSON format returned by the model.",
        );
      }
    }

    const match = cleaned.match(/[\{\[]([\s\S]*)[\}\]]/);
    if (match) {
      try {
        return JSON.parse(match[0]) as T;
      } catch {
        logDiagnostic(
          "error",
          "Last-resort structured response parsing failed.",
        );
      }
    }
    throw new Error(
      "Could not find or parse a valid JSON block in the model response.",
    );
  }
};

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getDynamicValue = (record: UnknownRecord, key: string): unknown =>
  record[key];

export const postProcessSoapNote = <
  Soap extends { subjective?: unknown; objective?: unknown },
>(
  soap: Soap,
): Soap => {
  if (!soap) return soap;
  const flattenDynamicSection = (
    section: unknown,
    keyField: string,
    valueField: string,
  ): unknown => {
    if (!section) return section;
    if (Array.isArray(section)) {
      const flatObject: Record<string, string> = {};
      section.forEach((item: unknown) => {
        if (isRecord(item)) {
          const key = String(getDynamicValue(item, keyField) || "").trim();
          const value = String(getDynamicValue(item, valueField) || "").trim();
          if (key && value) flatObject[key] = value;
        }
      });
      return flatObject;
    }
    if (isRecord(section)) {
      const otherFindings = section.otherFindings;
      if (Array.isArray(otherFindings)) {
        otherFindings.forEach((item: unknown) => {
          if (isRecord(item)) {
            const key = String(
              item.category || item.system || item.systemOrRegion || "",
            ).trim();
            const value = String(item.finding || "").trim();
            if (key && value) section[key] = value;
          }
        });
        delete section.otherFindings;
      }
      return section;
    }
    return section;
  };

  if (isRecord(soap)) {
    const subjective = soap.subjective;
    if (isRecord(subjective)) {
      subjective.ros = flattenDynamicSection(
        subjective.ros,
        "system",
        "finding",
      );
      subjective.headsss = flattenDynamicSection(
        subjective.headsss,
        "category",
        "finding",
      );
    }
    const objective = soap.objective;
    if (isRecord(objective)) {
      objective.physicalExam = flattenDynamicSection(
        objective.physicalExam,
        "system",
        "finding",
      );
    }
  }
  return soap;
};
