# Data and persistence

Patient charts are stored in browser local storage using the `clinsight_patients` key, through `safeStorage` and patient-store coordination. This is local browser storage, not a shared database or managed backup. Data can be unavailable after browser profile/origin changes or browser storage is cleared. Do not use real patient information unless the deployment and handling environment has been explicitly assessed for that use.

`services/patientPersistence.ts` parses stored JSON, accepts records that satisfy the current chart shape, normalizes patient age/sex, migrates legacy charts without encounters, associates older entries/course events/orders with the first encounter, and hydrates attachments. Invalid JSON falls back to an empty patient collection with a generic console error. Keep migrations backward-compatible and cover legacy hydration in `tests/patient-persistence.test.ts`.

`services/attachmentPersistence.ts` serializes uploaded file bytes as base64 with metadata and removes runtime preview URLs. Hydration restores `File` objects and creates image previews. File conversion/opening behavior lives in `services/fileService.ts`; upload and camera hooks own their media lifecycle. When removing attachments/patients or unmounting, revoke preview URLs and stop media tracks. See the attachment persistence and file-upload/camera tests.

The app supports importing and exporting patient-case JSON through its existing workflows. Preserve serializable attachment content and test round trips when changing the shape. Imported data must be validated and normalized at the boundary; use only de-identified examples in tests and docs.

Drafts and selected feature preferences may use additional local-storage keys. Search the relevant feature hook before changing retention or key names; existing data can depend on them. There is no server-side backup or recovery workflow documented here because none is implemented in this repository.
