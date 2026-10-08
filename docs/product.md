# Product workflows

This page describes the implemented navigation and feature ownership. It is a map, not a substitute for clinical workflow training.

- **Access:** `src/features/access/` contains landing and login screens. Application composition in `src/App.tsx` decides which screen is active.
- **Dashboard:** `src/features/dashboard/` lists patient charts and provides entry into patient workflows.
- **New Patient / Input:** `src/features/input/` supports patient case entry, templates, imported cases, lookup and suggestions, and draft history.
- **Chart / SOAP:** `src/features/chart/` supports structured SOAP sections, history, references, status actions, clinical assistance, photo analysis, and clipboard formatting.
- **Course:** `src/features/course/` presents the patient course timeline.
- **Orders:** `src/features/orders/` manages diagnostic and medication orders, bulk entry, and prescription presentation.
- **Notes:** `src/features/notes/` manages patient notes, attachments, and note-thread inquiry.
- **Handoff:** `src/features/handoff/` presents patient handoff summaries.
- **Profile and Settings:** `src/features/profile/` manages general patient data; `src/features/settings/` owns app settings.
- **Chat:** `src/features/chat/` provides patient-context clinical conversation and save-to-note flows.

`src/App.tsx` composes views and patient-wide interactions. Shared navigation is in `src/app/shell/`; reusable dialogs are in `src/components/dialogs/`, generic controls and safe rich-content rendering are in `src/components/ui/`, and clinical presentation and source references are in `src/components/clinical/`. Patient narratives across chart history, the course timeline, original notes, patient notes, AI suggestions, and medical lookup results use the shared rendering pipeline for Markdown, KaTeX-supported math, and sanitized HTML fragments. Source disclosure is opt-in; images display their alt text without fetching remote media. When a workflow changes, update its source tests and any relevant persistence or AI contract documentation. See [design](../DESIGN.md) and [testing](testing.md).

Patient-note, chart-section, course-detail, and handoff-summary edits provide visual, source, and preview modes while retaining their existing save, cancel, attachment, and draft ownership. New-patient narrative, structured plan lines, general-management fields, smart append, bulk-order syntax, and order and medication notes use CodeMirror source editing. The visual editor supports emphasis, links, lists/checklists, quotes, headings, and tables; untouched source remains exact, and table formatting can normalize only after an intentional document edit. Math, HTML, and other unsupported content stays editable as source. Rich HTML paste sanitizes active content and unsafe links, keeps supported formatting, and converts remote images to alt text without fetching them. Chat keeps its compact composer and Enter-to-submit behavior, with IME composition protected from accidental submission. Compact inline exam fields, prescription instructions, and print-bound forms continue to use their workflow-specific controls during the staged editor migration.
