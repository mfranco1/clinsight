import { ClinicalSectionTitle, SoapNote } from "../../types";

type SubjectiveIntegrationField = "hpi" | "meds" | "family" | "social" | "pmh";
type ObjectiveIntegrationField = "physicalExam" | "labs" | "imaging";

export type IntegrationTarget =
  | {
      sectionTitle: "Subjective";
      field: SubjectiveIntegrationField;
      currentContent: string;
    }
  | {
      sectionTitle: "Objective";
      field: ObjectiveIntegrationField;
      currentContent: string;
    };

export function resolveIntegrationTarget(
  soap: SoapNote,
  sectionTitle: ClinicalSectionTitle,
  suggestions: string[],
): IntegrationTarget {
  const suggestion =
    suggestions.length === 1 ? suggestions[0].toLowerCase() : "";

  if (sectionTitle === "Subjective") {
    let field: SubjectiveIntegrationField = "hpi";
    if (suggestion.includes("medication") || suggestion.includes("allergic"))
      field = "meds";
    else if (suggestion.includes("family")) field = "family";
    else if (
      suggestion.includes("social") ||
      suggestion.includes("smoke") ||
      suggestion.includes("alcohol")
    )
      field = "social";
    else if (
      suggestion.includes("past medical") ||
      suggestion.includes("history of")
    )
      field = "pmh";
    return {
      sectionTitle,
      field,
      currentContent: soap.subjective[field] || "",
    };
  }

  let field: ObjectiveIntegrationField = "physicalExam";
  if (suggestion.includes("lab") || suggestion.includes("test")) field = "labs";
  else if (
    suggestion.includes("imaging") ||
    suggestion.includes("x-ray") ||
    suggestion.includes("ct")
  )
    field = "imaging";

  const value = soap.objective[field];
  return {
    sectionTitle,
    field,
    currentContent: typeof value === "string" ? value : String(value || ""),
  };
}

export function applyIntegrationResult(
  soap: SoapNote,
  target: IntegrationTarget,
  revisedContent: string,
  suggestions: string[],
): SoapNote {
  if (target.sectionTitle === "Subjective") {
    const currentAssistance = soap.subjective.clinicalAssistance;
    const clinicalAssistance = (
      Array.isArray(currentAssistance) ? currentAssistance : []
    ).filter(
      (item) =>
        !suggestions.some(
          (suggestion) =>
            item.includes(suggestion) || suggestion.includes(item),
        ),
    );
    return {
      ...soap,
      subjective: {
        ...soap.subjective,
        [target.field]: revisedContent,
        clinicalAssistance,
      },
    };
  }

  const currentAssistance = soap.objective.clinicalAssistance;
  const clinicalAssistance = (
    Array.isArray(currentAssistance) ? currentAssistance : []
  ).filter(
    (item) =>
      !suggestions.some(
        (suggestion) => item.includes(suggestion) || suggestion.includes(item),
      ),
  );
  return {
    ...soap,
    objective: {
      ...soap.objective,
      [target.field]: revisedContent,
      clinicalAssistance,
    },
  };
}
