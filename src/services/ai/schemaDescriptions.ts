import { DIAGNOSIS_RULES } from "./diagnosisRules";

export const SCHEMA_DESCRIPTIONS = {
  // Patient Info Face Sheet
  patientName: "Patient's complete name.",
  ageSex: "Demographic profile specifying Age and Sex.",
  mrn: "Medical Record Number (Case Number).",
  dob: "Date of Birth (DOB).",
  admissionDate: "Date of admission.",
  address: "Patient's home address.",
  religion: "Patient's religion.",
  handedness: "Patient's handedness (e.g., right, left, ambidextrous).",
  location:
    "Ward/Bed/Room Number if admitted, or clinic/room number if outpatient consult. Keep extremely brief and factual.",
  bloodType:
    "Patient's blood type (A/B/AB/O, +/-). Use the format [ABO Type][+/-], e.g., A+, O-, etc.",
  contactNumber: "Patient's contact phone number.",
  email: "Patient's email address.",
  patientInfo_overall:
    "Patient Identification (Face Sheet): You MUST extract the following fields separately: Patient Name, Age/Sex, MRN (Case Number), Date of Birth (DOB), Admission Date, Address, Religion, Handedness, Location (Ward/Bed/Room), Blood Type, Contact Number, and Email. If any field is not found, explicitly state 'Not Recorded'. Keep each value extremely brief, concise, and factual.",

  // Subjective
  chiefComplaint:
    "Concisely state the patient's primary reason for seeking medical attention. This should be a symptom they experienced which led them to seek medical attention.",
  hpi: "Complete, comprehensive, and detailed history of present illness prior to admission. May be several paragraphs long strictly separated into time periods. Be detailed and meticulous. Mention exact dates, drugs, doses, procedures (and results) when available. Highlight pertinent findings relevant to your specialty.",
  ros: "Review of Systems. MUST format as an array of objects representing systems with documented findings. Provide entries ONLY for systems actually present and documented in the source clinical texts.",
  ros_system:
    "Name of the system (e.g., Constitutional, HEENT, Respiratory, Cardiovascular, Gastrointestinal, Genitourinary, Musculoskeletal, Skin, Neurological, Psychiatric, Endocrine, Hematologic, Allergic or any other specific system).",
  ros_finding:
    "Clinical findings detail for this system. Highlight abnormal findings or pertinent details. Very concise. Don't use full sentences, just positives and negatives, e.g. (+) dyspnea, (-) chest pain, etc.",
  pmh: "Past Medical/Surgical history. Separate unrelated findings by newline.",
  meds: "Medications and Allergies. Separate unrelated findings by newline.",
  social:
    "Social history (smoking, drinking, drugs, occupation, education, household, religion, etc.). Separate unrelated findings by newline.",
  anamnesis:
    "Anamnesis (additional patient history context, background developments, or subjective insights from the patient's perspective). Only used for psychiatric, family medicine, general practice, or adolescent contexts. ONLY populate this if an anamnesis data section is explicitly present in the input sources.",
  family: "Family medical history.  Separate unrelated findings by newline.",
  birthMaternal: "Birth and maternal history (Pediatric).",
  immunizations:
    "Immunization records (Pediatric). Separate unrelated findings by newline.",
  nutrition: "Nutritional/Feeding history (Pediatric).",
  developmental:
    "Developmental milestones (Pediatric). Separate unrelated findings by newline.",
  headsss:
    "HEEADSSSS Assessment (Adolescent). MUST format as an array of objects representing categories with documented findings. Provide entries ONLY for categories actually present and documented in the source clinical texts.",
  headsss_category:
    "The specific HEEADSSSS category (e.g., Home, Education, Environment, Eating, Activities, Drugs, Sexuality, Suicide, Safety, Spirituality or any other unlisted dynamic category).",
  headsss_finding:
    "Psychosocial findings detail or assessment results for this category.",
  sexualHistory:
    "Complete sexual and OBGYN history, including last menstrual period (LMP), age of gestation, previous pregnancies, etc. if this data is available. Separate unrelated findings by newline.",
  subjective_clinicalAssistance:
    "Identify 3-5 specific, high-yield questions that are MISSING from the current data. You MUST always provide suggestions if any pertinent history is missing. Format as an array of strings, where each item is a unique, high-yield suggestion.",

  // Objective
  vitals: "Vital signs (BP, HR, RR, T, SpO2).",
  anthropometrics: "STRICTLY Height, Weight, BMI, etc. details.",
  physicalExam:
    "Detailed physical exam. MUST format as an array of objects representing regions or systems with documented findings. Might not be explicitly labeled in the source data so you must look for shorthand/acronym examinations (e.g., 'ECE CBS' as Lungs/Chest, 'SNA NABS' as Abdomen, 'DHS NRRR' as Cardiovascular, 'PPC CLADS NVE AMN' as HEENT, 'NICRD' as General, etc.) and infer/map them to their respective systems.",
  physicalExam_system:
    "Specific clinical system or anatomical region (e.g., General, Skin, HEENT, Neck, Chest/Lungs, Cardiovascular, Abdomen, Genitourinary, Extremities, Neurological, Psychiatric or any other examined area). Might not be expicitly labeled in the source data so you may need to infer.",
  physicalExam_finding:
    "Examination findings for this system/region. Highlight abnormal findings and pertinent details. Concise but complete, don't use full sentences.",
  labs: "COMPREHENSIVE and complete list with DATES. Group by type of test (e.g., group CBCs together) and order by date from most recent to oldest. The header (type of lab e.g., CBC or CHEM) should be on its own line followed by the actual labs in the format [mm/dd]: [list of results of the header type for that date]. One date-results pair per line. Highlight abnormal values. Label high values with '(H)' and low values with '(L)'. Use medically recognized acronyms where possible (e.g., K instead of potassium, CBC instead of complete blood count, Na instead of sodium, etc.).",
  labInterpretation:
    "You MUST provide a DETAILED interpretation of lab results and clinical correlation as an array of strings, where each array item represents a unique high-yield clinical finding. Only interpret lab results in this section, do not interpret the physical exam in this section. Be straight to the point and avoid filler.",
  imaging:
    "COMPREHENSIVE and complete list with DATES and IMPRESSIONS. Group by type of diagnostic (e.g., group Chest Xrays together) and order by date from most recent to oldest. Bold pertinent info.",
  imagingCorrelation:
    "You MUST provide a DETAILED interpretation of imaging results and clinical correlation as an array of strings, where each array item represents a unique high-yield clinical correlation. Be straight to the point and avoid filler.",
  objective_clinicalAssistance:
    "Identify 3-5 specific, high-yield physical exam maneuvers, signs, or diagnostic tests/imaging that are MISSING from the current data. You MUST always provide suggestions if the objective workup is incomplete. Format as an array of strings, where each item is a unique, high-yield suggestion.",

  // Assessment
  assessment_summary: `Complete Diagnosis: You MUST produce a high-fidelity list that serves as a complete and formal clinical diagnosis. Adhere to these rules: ${DIAGNOSIS_RULES}`,
  assessment_rationale:
    "Detailed reasoning and rationale behind each specific diagnosis/problem of the patient citing supporting evidence as an array of strings, where each array item represents a unique high-yield clinical justification or reasoning point. Note whether the patient is improving, deteriorating, or stable. Be straight to the point and avoid filler.",
  assessment_icdCodes:
    "Provide the latest and most relevant ICD-10 codes for each primary diagnosis. Format each as CODE: Description. Use Search Grounding where available to ensure code accuracy and current validity.",
  assessment_differentialDiagnosis:
    "Provide 3-5 most likely alternative diagnoses with Evidence For and Evidence Against based on all the data provided.",

  // Plan
  plan_overall: `Problem-Based Plan: For each problem/diagnosis, you MUST provide complete, specific, and detailed evidence-based action items categorized into: Diagnostics, Therapeutics, Other. Action items MUST be placed in their specific categories instead of a generic action list whenever possible.`,
  plan_problem:
    "The specific diagnosis or problem from the assessment being addressed.",
  plan_actions:
    "Generic action items (use sparingly, prefer placing in specific diagnostics/therapeutics/other lists).",
  plan_diagnostics:
    "MANDATORY complete and specific list of laboratory, imaging, biopsy, or specific diagnostic procedures for this problem. Do not leave empty if diagnostics are relevant.",
  plan_therapeutics:
    "MANDATORY complete and specific list of medications (using specific, weight-based, or standard dosing regimens with Drug, Dose, Route, Frequency, and Duration) or surgical/therapeutic procedures for this problem.",
  plan_other:
    "MANDATORY complete and specific list of patient education, lifestyle advice, activity restrictions, specific discharge instructions, or non-pharmacologic management for this problem.",

  // Broader Management
  broaderManagement_disposition:
    "Patient disposition (e.g., home, admit to ward, transfer to ICU, outpatient follow-up).",
  broaderManagement_diet:
    "Recommended dietary guidelines and status (e.g., NPO, soft diet, low sodium, regular).",
  broaderManagement_ivFluids:
    "Intravenous fluid regimen (specific exact fluid type, rate, and volume, e.g., PNSS 1L at 80cc/hr).",
  broaderManagement_o2Support:
    "Oxygenation support details (e.g., room air, nasal cannula 2LPM, high-flow, mechanical ventilation).",
  broaderManagement_monitoring:
    "Patient monitoring and nursing directives schedule (e.g., Vital Signs q4h, strictly monitor I&O qshift).",
  broaderManagement_wof:
    "WOF (watch out for / red flags) warning symptoms or complications to closely monitor.",
  broaderManagement_referrals:
    "Active specialist consults and referrals (e.g., Cardiology consult, Physical Therapy referral) as a markdown bulleted list.",

  // Course Timeline
  course_overall:
    "Reconstruct an EXHAUSTIVE, complete chronological day-by-day clinical timeline of the patient's hospital stay. You MUST capture every significant clinical event—including major lab trends, imaging results, medication changes, procedures, and specialist consultations—for EVERY SINGLE DATE mentioned in the source material. Detail exact drug doses and diagnostic results. Exclude minor administrative nursing notes but include critical clinical observations.",
  course_date:
    "Formatted date of the clinical event (YYYY-MM-DD or MM/DD/YYYY to match source).",
  course_time:
    "Approximate local time of the event if specified, in HH:MM format, or null.",
  course_event:
    "Title of the clinical milestone/event (e.g., 'Admission', 'Intubation', 'Extubated', 'Bacteremia Clearance').",
  course_details:
    "Detailed clinical narrative of findings, vitals, lab values, treatment changes, or results of the procedure on this date. Be straight to the point and avoid filler.",

  // Handoff Summary
  handoff_overall:
    "Detailed IPASS summary capsule consisting of 2-3 comprehensive paragraphs covering the absolute crucial details, trend lines, current active clinical thinking, and exact diagnostic values.",
  handoff_patientId: "The unique identifier or MRN tracking ID of the patient.",
  handoff_oneLiner:
    "A comprehensive 2-3 paragraph summary of the patient's hospital course and current status.",
  handoff_activeIssues:
    "A list of newly identified, active, or currently unresolved medical problems.",
  handoff_toDoList:
    "A prioritized list of pending actionable items, next-day diagnostics, pending labs, or procedures.",

  // References
  references:
    "Full bibliographic references in AMA format tracking each guideline, clinical trial, or textbook referenced.",
};
