import { Type } from "@google/genai";
import { SCHEMA_DESCRIPTIONS } from "../schemaDescriptions";

export const ASSESSMENT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: SCHEMA_DESCRIPTIONS.assessment_summary,
    },
    rationale: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: SCHEMA_DESCRIPTIONS.assessment_rationale,
    },
    icdCodes: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: SCHEMA_DESCRIPTIONS.assessment_icdCodes,
    },
    differentialDiagnosis: {
      type: Type.ARRAY,
      description: SCHEMA_DESCRIPTIONS.assessment_differentialDiagnosis,
      items: {
        type: Type.OBJECT,
        properties: {
          diagnosis: { type: Type.STRING },
          evidenceFor: { type: Type.ARRAY, items: { type: Type.STRING } },
          evidenceAgainst: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["diagnosis", "evidenceFor", "evidenceAgainst"],
      },
    },
  },
  required: ["summary", "rationale", "icdCodes", "differentialDiagnosis"],
};

export const PLAN_SCHEMA = {
  type: Type.ARRAY,
  description: SCHEMA_DESCRIPTIONS.plan_overall,
  items: {
    type: Type.OBJECT,
    properties: {
      problem: {
        type: Type.STRING,
        description: SCHEMA_DESCRIPTIONS.plan_problem,
      },
      actions: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: SCHEMA_DESCRIPTIONS.plan_actions,
      },
      diagnostics: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: SCHEMA_DESCRIPTIONS.plan_diagnostics,
      },
      therapeutics: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: SCHEMA_DESCRIPTIONS.plan_therapeutics,
      },
      other: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: SCHEMA_DESCRIPTIONS.plan_other,
      },
    },
    required: ["problem"],
  },
};

export const BROADER_MANAGEMENT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    disposition: {
      type: Type.STRING,
      description: SCHEMA_DESCRIPTIONS.broaderManagement_disposition,
    },
    diet: {
      type: Type.STRING,
      description: SCHEMA_DESCRIPTIONS.broaderManagement_diet,
    },
    ivFluids: {
      type: Type.STRING,
      description: SCHEMA_DESCRIPTIONS.broaderManagement_ivFluids,
    },
    o2Support: {
      type: Type.STRING,
      description: SCHEMA_DESCRIPTIONS.broaderManagement_o2Support,
    },
    monitoring: {
      type: Type.STRING,
      description: SCHEMA_DESCRIPTIONS.broaderManagement_monitoring,
    },
    wof: {
      type: Type.STRING,
      description: SCHEMA_DESCRIPTIONS.broaderManagement_wof,
    },
    referrals: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: SCHEMA_DESCRIPTIONS.broaderManagement_referrals,
    },
  },
};

export const SOAP_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    subjective: {
      type: Type.OBJECT,
      properties: {
        chiefComplaint: {
          type: Type.STRING,
          nullable: true,
          description: SCHEMA_DESCRIPTIONS.chiefComplaint,
        },
        hpi: { type: Type.STRING, description: SCHEMA_DESCRIPTIONS.hpi },
        ros: {
          type: Type.ARRAY,
          description: SCHEMA_DESCRIPTIONS.ros,
          items: {
            type: Type.OBJECT,
            properties: {
              system: {
                type: Type.STRING,
                description: SCHEMA_DESCRIPTIONS.ros_system,
              },
              finding: {
                type: Type.STRING,
                description: SCHEMA_DESCRIPTIONS.ros_finding,
              },
            },
            required: ["system", "finding"],
          },
        },
        pmh: { type: Type.STRING, description: SCHEMA_DESCRIPTIONS.pmh },
        meds: { type: Type.STRING, description: SCHEMA_DESCRIPTIONS.meds },
        social: { type: Type.STRING, description: SCHEMA_DESCRIPTIONS.social },
        anamnesis: {
          type: Type.STRING,
          nullable: true,
          description: SCHEMA_DESCRIPTIONS.anamnesis,
        },
        family: { type: Type.STRING, description: SCHEMA_DESCRIPTIONS.family },
        birthMaternal: {
          type: Type.STRING,
          nullable: true,
          description: SCHEMA_DESCRIPTIONS.birthMaternal,
        },
        immunizations: {
          type: Type.STRING,
          nullable: true,
          description: SCHEMA_DESCRIPTIONS.immunizations,
        },
        nutrition: {
          type: Type.STRING,
          nullable: true,
          description: SCHEMA_DESCRIPTIONS.nutrition,
        },
        developmental: {
          type: Type.STRING,
          nullable: true,
          description: SCHEMA_DESCRIPTIONS.developmental,
        },
        headsss: {
          type: Type.ARRAY,
          nullable: true,
          description: SCHEMA_DESCRIPTIONS.headsss,
          items: {
            type: Type.OBJECT,
            properties: {
              category: {
                type: Type.STRING,
                description: SCHEMA_DESCRIPTIONS.headsss_category,
              },
              finding: {
                type: Type.STRING,
                description: SCHEMA_DESCRIPTIONS.headsss_finding,
              },
            },
            required: ["category", "finding"],
          },
        },
        sexualHistory: {
          type: Type.STRING,
          nullable: true,
          description: SCHEMA_DESCRIPTIONS.sexualHistory,
        },
        clinicalAssistance: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          nullable: true,
          description: SCHEMA_DESCRIPTIONS.subjective_clinicalAssistance,
        },
      },
      required: ["hpi", "ros", "pmh", "meds", "social", "family"],
    },
    objective: {
      type: Type.OBJECT,
      properties: {
        vitals: { type: Type.STRING, description: SCHEMA_DESCRIPTIONS.vitals },
        anthropometrics: {
          type: Type.STRING,
          nullable: true,
          description: SCHEMA_DESCRIPTIONS.anthropometrics,
        },
        physicalExam: {
          type: Type.ARRAY,
          description: SCHEMA_DESCRIPTIONS.physicalExam,
          items: {
            type: Type.OBJECT,
            properties: {
              system: {
                type: Type.STRING,
                description: SCHEMA_DESCRIPTIONS.physicalExam_system,
              },
              finding: {
                type: Type.STRING,
                description: SCHEMA_DESCRIPTIONS.physicalExam_finding,
              },
            },
            required: ["system", "finding"],
          },
        },
        labs: { type: Type.STRING, description: SCHEMA_DESCRIPTIONS.labs },
        labInterpretation: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          nullable: true,
          description: SCHEMA_DESCRIPTIONS.labInterpretation,
        },
        imaging: {
          type: Type.STRING,
          description: SCHEMA_DESCRIPTIONS.imaging,
        },
        imagingCorrelation: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          nullable: true,
          description: SCHEMA_DESCRIPTIONS.imagingCorrelation,
        },
        clinicalAssistance: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          nullable: true,
          description: SCHEMA_DESCRIPTIONS.objective_clinicalAssistance,
        },
      },
      required: ["vitals", "physicalExam", "labs", "imaging"],
    },
    assessment: ASSESSMENT_SCHEMA,
    plan: PLAN_SCHEMA,
    broaderManagement: BROADER_MANAGEMENT_SCHEMA,
  },
  required: ["subjective", "objective", "assessment", "plan"],
};
