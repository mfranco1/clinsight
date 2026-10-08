import { ViewMode } from "../types";

export const SPECIALIZATIONS = [
  "General Practice",
  "Internal Medicine",
  "Pediatrics",
  "Surgery",
  "OB-GYN",
  "Family Medicine",
  "Community Medicine",
  "Cardiology",
  "Pulmonology",
  "Neurology",
  "Nephrology",
  "Hematology",
  "Rheumatology",
  "Gastroenterology",
  "Endocrinology",
  "Infectious Diseases",
  "Geriatric Medicine",
  "Psychiatry",
  "Anesthesiology",
  "Emergency Medicine",
  "Medical Oncology",
  "Radiation Oncology",
  "Interventional Radiology",
  "Diagnostic Ragiology",
  "Dermatology",
  "Rehab Medicine",
  "Orthopedics",
  "Ophthalmology",
  "Otorhinolaryngology",
];

export const MODELS = [
  //{ id: 'gemma-4-26b-a4b-it', label: 'Low 4.0', supportsStructuredOutput: false },
  {
    id: "gemini-3.5-flash-lite",
    label: "Lite 3.5",
    supportsStructuredOutput: true,
  },
  {
    id: "gemini-3.7-flash",
    label: "Flash 3.7",
    supportsStructuredOutput: true,
  },
  {
    id: "gemini-3.1-pro-preview",
    label: "Pro 3.1",
    supportsStructuredOutput: true,
  },
];

export const DEFAULT_MODEL = MODELS[0].id;
export const DEFAULT_STRUCTURED_MODEL = "gemini-3.5-flash-lite";

export const NAV_ITEMS = [
  { id: ViewMode.DASHBOARD, label: "Dashboard", icon: "LayoutGrid" },
  { id: ViewMode.INPUT, label: "New Patient", icon: "Plus" },
];
