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
