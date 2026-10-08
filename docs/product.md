# Product workflows

This page describes the implemented navigation and feature ownership. It is a map, not a substitute for clinical workflow training.

- **Access:** `features/access/` contains landing and login screens. Application composition in `App.tsx` decides which screen is active.
- **Dashboard:** `features/dashboard/` lists patient charts and provides entry into patient workflows.
- **New Patient / Input:** `features/input/` supports patient case entry, templates, imported cases, lookup and suggestions, and draft history.
- **Chart / SOAP:** `features/chart/` supports structured SOAP sections, history, references, status actions, clinical assistance, photo analysis, and clipboard formatting.
- **Course:** `features/course/` presents the patient course timeline.
- **Orders:** `features/orders/` manages diagnostic and medication orders, bulk entry, and prescription presentation.
- **Notes:** `features/notes/` manages patient notes, attachments, and note-thread inquiry.
- **Handoff:** `features/handoff/` presents patient handoff summaries.
- **Profile and Settings:** `features/profile/` manages general patient data; `features/settings/` owns app settings.
- **Chat:** `features/chat/` provides patient-context clinical conversation and save-to-note flows.

`App.tsx` composes views and patient-wide interactions. Shared navigation is in `app/shell/`; reusable dialogs and controls are in `components/` and `components/ui/`. When a workflow changes, update its source tests and any relevant persistence or AI contract documentation. See [design](../DESIGN.md) and [testing](testing.md).
