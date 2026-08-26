import { ViewMode } from '../types';

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
  "Otorhinolaryngology"
];

export const APP_ICON_DATA_URL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%230d9488' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.3.3 0 1 0 .2.3'%3E%3C/path%3E%3Cpath d='M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4'%3E%3C/path%3E%3Ccircle cx='20' cy='10' r='2'%3E%3C/circle%3E%3C/svg%3E";

export const MODELS = [
  //{ id: 'gemma-4-26b-a4b-it', label: 'Low 4.0', supportsStructuredOutput: false },
  { id: 'gemini-3.5-flash-lite', label: 'Lite 3.5', supportsStructuredOutput: true },
  { id: 'gemini-3.7-flash', label: 'Flash 3.7', supportsStructuredOutput: true },
  { id: 'gemini-3.1-pro-preview', label: 'Pro 3.1', supportsStructuredOutput: true },
];

export const DEFAULT_MODEL = MODELS[0].id;
export const DEFAULT_STRUCTURED_MODEL = 'gemini-3.5-flash-lite';

export const NAV_ITEMS = [
  { id: ViewMode.DASHBOARD, label: "Dashboard", icon: "LayoutGrid" },
  { id: ViewMode.INPUT, label: "New Patient", icon: "Plus" },
];
