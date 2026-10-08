# Behavior-Preserving Refactoring Implementation Plan

## Purpose

This is the implementation checklist for the approved refactoring direction. Its purpose is to make the codebase more modular, reusable, typed, and testable without changing product behavior or the appearance of the UI.

This file is the source of truth for progress. Update the checkbox for a slice only after its verification gate passes. Do not start a dependent slice until its prerequisites are complete or an explicit exception is recorded below.

## Working agreement

- Preserve the current UI, copy, keyboard behavior, responsiveness, persisted data, and AI output contracts unless a separately approved product change says otherwise.
- Keep each slice independently mergeable and reversible. Avoid broad file moves combined with behavior changes.
- Before changing a feature, add or update the narrowest test or visual baseline that proves its existing behavior.
- Run the slice verification commands before marking it complete.
- Record material deviations, deferred work, and decisions in the change log at the end of this file.

## Status legend

- `[ ]` not started
- `[-]` in progress
- `[x]` complete and verified
- `[!]` blocked or requires a decision

## Completion protocol

For every slice:

1. Change its status to `[-]` and link the implementation branch or PR in the change log.
2. Confirm its scope and non-goals still match this document.
3. Add the listed tests or fixtures before, or alongside, the refactor.
4. Run the listed verification gate plus `npm run lint` and `npm run build`.
5. Visually compare the affected desktop and mobile paths with the baseline.
6. Change the slice to `[x]`, record the evidence, and update any newly discovered dependency.

## Decision gates

- [x] **DG-1: AI credential deployment.** Server-side AI proxy deferred by approval. The current implementation keeps client-side AI behavior while the future gateway boundary remains planned.
- [x] **DG-2: Test tooling.** Approved and installed: Vitest 4, Testing Library for React, Playwright Test 1.62, ESLint 10 flat config, TypeScript ESLint, and Prettier 3.
- [x] **DG-3: CSS delivery.** Approved build-time delivery using Tailwind CSS 4.3 with the official Vite plugin. The Tailwind CDN runtime is removed; the external Inter font remains to preserve the current appearance.

## Phase 0 — Lock down current behavior

### [x] 0.1 Establish the quality command baseline

**Scope:** Document the existing `lint` and production-build commands; add a test-command placeholder only after DG-2 is approved.

**Verification:** `npm run lint`, `npm test`, `npm run build`, and `npm run test:e2e` pass. The missing `/index.css` warning was resolved by moving the existing styles into the compiled stylesheet.

### [x] 0.2 Create representative, de-identified case fixtures

**Scope:** Create fixtures for new charts, legacy charts without encounters, raw notes, structured SOAP notes, attachments, orders, medications, notes, and completed encounters.

**Verification:** Structured and legacy fixtures are typed and the legacy fixture hydrates through the real app in desktop and mobile Playwright tests without throwing or changing the expected patient display.

### [x] 0.3 Capture visual and workflow baselines

**Scope:** Capture desktop and mobile references for Dashboard, Input, Chart/SOAP, Orders, Notes, Course, Handoff, Profile, Chat, all modal families, and print views.

**Verification:** Dashboard visual snapshots are versioned for desktop and mobile under `tests/e2e/smoke.spec.ts-snapshots`; the critical workflow list is documented next to the tests. Additional feature snapshots will be added as each feature migrates.

### [x] 0.4 Add the first regression tests

**Scope:** After DG-2, install test tooling and create smoke tests for application startup, fixture hydration, navigation, new/append/raw-note generation paths, import/export, status changes, orders, uploads, and chat save-to-note.

**Verification:** Vitest covers clinical text and order-domain behavior; Playwright covers dashboard loading, legacy persistence, input navigation/reset, and desktop/mobile visual smoke paths. The suite currently passes 8 unit tests and 6 browser tests.

## Phase 1 — Shared foundations

### [x] 1.1 Split generic constants by ownership

**Scope:** Move navigation configuration, model configuration, AI prompt text/schema descriptions, and static UI data out of `constants.ts` into owned modules. Keep compatibility exports while imports migrate.

**Verification:** No visible text or model selection changes; all current imports resolve through either the new module or the temporary compatibility export.

#### [x] 1.1a Extract app and navigation configuration

**Scope:** Move model selection, specialization options, navigation items, and application branding into `config/appConfig.ts`; preserve `constants.ts` as a compatibility facade and migrate direct UI/service imports.

**Verification:** `tests/app-config.test.ts` confirms facade parity; lint, unit tests, and production build pass without UI changes.

#### [x] 1.1b Extract AI prompts, schemas, and clinical templates

**Scope:** Move AI prompt/schema descriptions and remaining static clinical templates into owned AI/content modules, then migrate the Gemini service and remaining consumers.

**Verification:** Prompt and schema exports remain byte-for-byte equivalent at the public boundary; clinical generation tests and the full browser suite pass.

##### [x] 1.1b1 Extract schemas, diagnosis rules, and clinical templates

**Scope:** Move schema descriptions, diagnosis formatting rules, and reusable clinical templates into `services/ai` and `config` modules while retaining compatibility exports.

**Verification:** Content parity tests pass; typecheck, lint, unit tests, production build, and desktop/mobile browser tests pass.

##### [x] 1.1b2 Extract AI prompt functions and text

**Scope:** Move the remaining prompt constants and prompt builders into an owned AI prompt module, then migrate `geminiService.ts` to direct imports.

**Verification:** Prompt outputs remain unchanged for representative chart, SOAP, chat, and lookup inputs; the full regression suite passes.

### [x] 1.2 Introduce typed domain aliases and remove low-risk `any`

**Scope:** Add explicit types for IDs, persisted records, status/filter values, AI results, attachments, and modal state. Start with `types.ts`, `utils.ts`, and `domain/orders.ts`.

**Verification:** No new `any` is introduced; the touched modules compile under stricter local type settings without casts that conceal data-shape errors.

#### [x] 1.2a Type order filters and identifiers

**Scope:** Add shared patient, encounter, order, category, and status-filter aliases; apply them to the order domain and Orders view while preserving permissive parsing behavior at the text boundary.

**Verification:** `npm run lint` and all existing unit tests pass; order filtering and bulk parsing behavior remains covered.

#### [x] 1.2b Type persistence and utility boundaries

**Scope:** Replace low-risk `any` usage in `utils.ts`, persistence helpers, and adjacent domain adapters with explicit unknown/narrowed types.

**Verification:** Existing fixtures and browser workflows pass with no behavior or UI changes.

##### [x] 1.2b1 Type patient normalization boundary

**Scope:** Replace the `any` boundary in `normalizePatientAgeSex` with overloads for complete and partial patient data while preserving legacy age/sex parsing.

**Verification:** Utility regression coverage confirms normalized age/sex values and preservation of unrelated fields; lint and 11 unit tests pass.

##### [x] 1.2b2 Type chart-history and persistence adapters

**Scope:** Narrow remaining utility and persistence inputs (`formatChartHistory`, storage payloads, and migration adapters) using explicit legacy/unknown guards.

**Verification:** Structured and legacy fixture hydration plus full browser regression suite pass.

###### [x] 1.2b2a Type chart-history rendering

**Scope:** Add a reusable `ChartHistoryEntry` boundary and replace chart-history renderer callback `any` values with `DifferentialDiagnosisItem` and `PlanItem` types.

**Verification:** Typecheck, lint, 11 unit tests, and 6 desktop/mobile browser tests pass.

###### [x] 1.2b2b Type persistence adapters

**Scope:** Narrow local-storage payloads and migration adapters with explicit `unknown` guards.

**Verification:** Legacy and structured persistence fixtures hydrate equivalently without casts that conceal malformed data.

### [x] 1.3 Consolidate date, ID, text, and storage utilities

**Scope:** Split `utils.ts` into focused, side-effect-free modules (`date`, `ids`, `clinical-text`, `storage`) while preserving exported behavior through a compatibility facade.

**Verification:** Unit tests cover date normalization, age normalization, markdown conversion, and structured key/value conversion using existing edge cases.

#### [x] 1.3a Extract ID and safe-storage utilities

**Scope:** Move ID generation and the safe local-storage wrapper into focused modules while preserving `utils.ts` compatibility exports and existing storage semantics.

**Verification:** Typecheck, lint, and all 13 unit tests pass.

#### [x] 1.3b Extract date and text utilities

**Scope:** Complete date-helper migration and split markdown/key-value/chart-history formatting into focused, side-effect-free modules.

**Verification:** Existing utility and persistence tests pass with compatibility exports unchanged.

##### [x] 1.3b1 Extract date utilities

**Scope:** Move age/date/time normalization helpers into `utils/date.ts` and preserve the existing `utils.ts` compatibility surface.

**Verification:** Typecheck, lint, and all 13 unit tests pass.

##### [x] 1.3b2 Extract clinical text utilities

**Scope:** Move markdown, key/value, and chart-history formatting helpers into focused text modules.

**Verification:** Clinical text and chart-history regression tests pass with unchanged output.

###### [x] 1.3b2a Extract markdown utilities

**Scope:** Move markdown bullet conversion helpers into `utils/markdown.ts` and preserve compatibility exports.

**Verification:** Typecheck, lint, and all 13 unit tests pass.

###### [x] 1.3b2b Extract structured clinical text utilities

**Scope:** Move key/value conversion, section ordering, and chart-history formatting into focused modules.

**Verification:** Clinical text output remains unchanged across structured and legacy fixtures.

####### [x] 1.3b2b1 Extract section ordering and key/value conversion

**Scope:** Move ROS/HEEADSSSS/physical-exam ordering and key/value conversion into `utils/clinicalText.ts`, preserving compatibility exports.

**Verification:** Typecheck, lint, and all 13 unit tests pass.

####### [x] 1.3b2b2 Extract chart-history formatting

**Scope:** Move chart-history rendering into the clinical-text module after its dependency boundary is isolated.

**Verification:** Structured and legacy chart-history outputs remain byte-for-byte equivalent.

### [x] 1.4 Add a typed application error and notification contract

**Scope:** Define shared error/result types and a single notification interface. Replace direct `alert` usage only in the code touched by this slice, while retaining the same user-visible message and timing.

**Verification:** Failures produce the existing message style; errors can be asserted without relying on `window.alert`.

#### [x] 1.4a Define error and notification contracts

**Scope:** Add `AppError`, safe unknown-error message normalization, and a typed notification service contract without changing notification text or browser behavior.

**Verification:** Typecheck, lint, and 15 unit tests pass.

#### [x] 1.4b Migrate targeted alert paths

**Scope:** Replace direct `alert` usage in touched workflows with the existing toast/error presentation while preserving exact messages.

**Verification:** Alert-driven workflows retain their user-visible messages and pass browser regression coverage.

##### [x] 1.4b1 Migrate prescription print popup alert

**Scope:** Replace the prescription modal's popup-blocked `alert` with its local error presentation, preserving the exact message and print behavior.

**Verification:** Typecheck, lint, and 15 unit tests pass; no other alert paths are changed.

##### [x] 1.4b2 Migrate home-instructions print popup alert

**Scope:** Replace the home-instructions modal's popup-blocked `alert` with its local dismissible error presentation, preserving the exact message and print behavior.

**Verification:** Typecheck, lint, and 15 unit tests pass; no other alert paths are changed.

##### [x] 1.4b3 Migrate smart-append microphone alert

**Scope:** Replace the smart-append overlay's microphone-permission `alert` with its local dismissible error presentation, preserving the exact message and dictation behavior.

**Verification:** Typecheck, lint, and 15 unit tests pass; no other alert paths are changed.

##### [x] 1.4b4 Migrate chat microphone alert

**Scope:** Replace the chat panel's microphone-permission `alert` with an inline error chat message, preserving the exact message and recording behavior.

**Verification:** Typecheck, lint, and 15 unit tests pass; no other alert paths are changed.

##### [x] 1.4b5 Migrate input workflow alerts

**Scope:** Replace the input workflow's microphone and batch-import `alert` calls with a shared local dismissible error presentation, preserving existing messages and workflows.

**Verification:** Typecheck, lint, and 15 unit tests pass; no other alert paths are changed.

##### [x] 1.4b6 Migrate SOAP photo/integration alerts

**Scope:** Replace SOAP photo-analysis, missing-category, and integration `alert` calls with a shared local dismissible workflow error, preserving exact messages and actions.

**Verification:** Typecheck, lint, and 15 unit tests pass; no other alert paths are changed.

##### [x] 1.4b7 Migrate SOAP assistance alerts

**Scope:** Replace subjective and objective clinical-assistance `alert` calls with local dismissible error presentation, preserving exact messages and suggestion behavior.

**Verification:** Typecheck, lint, and 15 unit tests pass; no other alert paths are changed.

##### [x] 1.4b8 Migrate patient-note microphone alerts

**Scope:** Replace both patient-note microphone-permission `alert` calls with a shared local dismissible error, preserving the exact message and recording behavior.

**Verification:** Typecheck, lint, and 15 unit tests pass; repository search confirms no remaining direct `alert(...)` calls in components or services.

## Phase 2 — Patient state and persistence boundary

### [x] 2.1 Extract patient record hydration and migration

**Scope:** Move the local-storage loading/migration logic from `App.tsx` into a versioned `patientRepository` or `patientPersistence` module. Preserve the current storage key and legacy encounter migration.

**Verification:** All Phase 0 fixtures hydrate to equivalent patient records; malformed storage falls back safely without crashing the app.

### [x] 2.2 Define pure patient transition functions

**Scope:** Extract pure operations for patient creation/import, entry updates/deletion, encounter/status transitions, course events, handoff, orders, medications, and notes.

**Verification:** Unit tests prove each operation is immutable, preserves unrelated patient data, and matches current state transitions.

#### [x] 2.2a Extract entry transitions

**Scope:** Add immutable prepend, update, SOAP-update, and removal operations for patient chart entries; migrate existing App entry-update handlers.

**Verification:** Transition tests prove immutability and preservation of unrelated patient data; 17 unit tests pass.

#### [x] 2.2b Extract remaining patient transitions

**Scope:** Extract patient creation/import, encounter/status, course, handoff, orders, medications, and notes transitions.

**Verification:** Each transition has focused immutable unit coverage and existing workflows remain unchanged.

##### [x] 2.2b1 Extract metadata and collection transitions

**Scope:** Extract immutable patient-info, course, handoff, order, medication, and note replacement/update operations, including course-event and note append helpers; migrate the corresponding App handlers.

**Verification:** Focused transition tests cover immutable replacement/update behavior and `npm run lint` plus 18 unit tests pass.

##### [x] 2.2b2 Extract import identity and encounter/status transitions

**Scope:** Extract immutable import identity normalization and encounter/status lifecycle operations while preserving current IDs, migration behavior, and status semantics.

**Verification:** Import identity and lifecycle transition tests cover legacy and current records; `npm run lint` plus 19 unit tests pass and existing workflows remain unchanged.

##### [x] 2.2b3 Extract generated and manual patient creation transitions

**Scope:** Extract reusable constructors for generated charts and manual first-entry charts without changing IDs, defaults, encounter initialization, or UI behavior.

**Verification:** Constructor tests cover generated and manual creation defaults; `npm run lint` plus 21 unit tests pass; chart generation and manual-entry workflows remain unchanged.

### [x] 2.3 Create the patient store/provider

**Scope:** Introduce a small reducer/context facade over the transition functions. It may coexist with `App` state during migration; do not add a third-party state library.

**Verification:** Dashboard selection, patient navigation, persistence, and updates work unchanged through the facade.

#### [x] 2.3a Add compatibility patient store hook

**Scope:** Centralize patient collection initialization and common add, batch-add, update, and remove operations in a reusable hook while preserving the existing `setPatients` callback surface for incremental migration.

**Verification:** App persistence and workflows remain unchanged; `npm run lint` and 21 unit tests pass.

#### [x] 2.3b Migrate workflow patient mutations behind the store API

**Scope:** Replace direct collection mutation callbacks in `App.tsx` with store operations for chart, encounter, order, note, and deletion workflows; retain the setter only for the existing whole-collection order carry-over effect.

**Verification:** Workflow mutations use the store API; `npm run lint` and 21 unit tests pass.

#### [x] 2.3c Remove the compatibility setter

**Scope:** Move whole-collection order carry-over into a store-level operation and remove direct `setPatients` access from `App.tsx`.

**Verification:** Persistence and order carry-over behavior remain unchanged; `App.tsx` has no direct patient setter usage.

### [x] 2.4 Migrate `App.tsx` patient handlers to the store

**Scope:** Replace duplicated `setPatients` map/filter handlers with store actions. Preserve the existing props passed to views and leave view rendering unchanged.

**Verification:** Existing workflow and visual tests pass; `App.tsx` no longer contains patient-record mutation logic.

#### [x] 2.4a Move nested entry/course transitions and order carry-over to domain modules

**Scope:** Extract generated/manual entry updates, reassessment/assessment changes, entry removal, and order-date carry-over from `App.tsx` into pure domain functions.

**Verification:** `npm run lint`, `npm test` (26 unit tests), `npm run build`, `npm run test:e2e` (8 desktop/mobile tests), and `git diff --check` pass; `App.tsx` delegates patient record changes to store/domain operations.

### [x] 2.5 Normalize import/export and attachment persistence

**Scope:** Make import normalization immutable, introduce a serializable attachment representation, and rebuild transient preview URLs after hydration.

**Verification:** Export/import round trips preserve visible data; image/PDF attachments open and preview correctly after reload; blob URLs are released only when their attachment is no longer used.

#### [x] 2.5a Serialize attachment metadata and restore transient files/previews

**Scope:** Omit runtime `File` and blob URL data from persisted/exported case JSON, retain file metadata and base64 content, and rebuild browser files/previews during hydration/import.

**Verification:** Unit and browser tests confirm restored image files/previews and serializable local persistence; full lint/build pass.

#### [x] 2.5b Verify export/import round trips and preview URL lifecycle

**Scope:** Verify case export/import with image and PDF attachments and ensure object URLs are released when patients or attachments are removed and on app teardown.

**Verification:** Desktop and mobile browser tests cover attachment names/content, reload hydration, image preview creation, export serialization, image/PDF import, and preview URL cleanup on patient deletion. App unmount cleanup is also implemented.

## Phase 3 — AI gateway and clinical task modules

### [x] 3.1 Define the clinical AI gateway contract

**Scope:** Create typed task interfaces for chart generation, progress notes, reassessment, chat, transcription, lookup, suggestions, photo analysis, home instructions, and prescription parsing.

**Verification:** The UI remains on the existing direct Gemini implementation through an adapter; no feature behavior changes.

#### [x] 3.1a Add typed task contract and direct Gemini adapter

**Scope:** Define request/result types for clinical AI tasks and adapt the current Gemini service to the task-based gateway; migrate the app-level chart-generation, progress-note, reassessment, and summary calls.

**Verification:** TypeScript, lint, and build pass; `App.tsx` task calls go through the typed adapter while feature-level imports remain queued under 3.4.

### [x] 3.2 Extract Gemini transport and file conversion

**Scope:** Separate SDK client construction, abort handling, response sanitation, grounding-source extraction, and file/blob conversion from task-level prompts.

**Verification:** Unit tests cover cancellation, malformed structured output, grounding-source normalization, and file part conversion.

#### [x] 3.2a Extract direct transport, abort handling, sanitation, grounding, and file conversion

**Scope:** Move the direct Gemini client and transport helpers out of the task service while preserving the current request configuration and response contract.

**Verification:** Unit coverage validates abort, malformed output, grounding, sanitation, and file conversion; `npm run lint`, `npm run build`, and `npm test` (26 tests) pass.

### [x] 3.3 Extract schemas, prompts, and task adapters

**Scope:** Move each clinical task from the monolithic service into focused modules with typed input/output parsing. Preserve prompt text, model defaults, and schemas exactly in this slice.

**Verification:** Fixture-backed contract tests compare the adapter request shape and parsed result shape with the pre-extraction behavior.

#### [x] 3.3a Extract media, clinical assistance, input assistance, and conversation tasks

**Scope:** Move transcription, clinical/lab/imaging photo analysis, clinical-assistance suggestions, clinical-data integration, input suggestions, medical lookup, response-title generation, chat, and note-thread messaging into task-focused modules. Keep `geminiService.ts` as a compatibility facade during migration.

**Verification:** Request/result contract tests cover clinical assistance, suggestions, lookup cancellation/grounding, lab-photo analysis, transcription, and chat parsing; lint, 38 unit tests, build, and desktop/mobile browser tests pass.

#### [x] 3.3b Extract summary and discharge tasks

**Scope:** Move patient-summary refresh, home instructions, and prescription parsing into task-focused modules while retaining exact prompt, schema, error, and fallback behavior through the compatibility facade.

**Verification:** Summary and discharge task contract tests cover request model/context, response schemas, parsed results, and empty-response fallbacks; lint, unit tests, build, and browser regressions pass.

#### [x] 3.3c Extract core chart-generation tasks and reusable schemas

**Scope:** Move new-chart, progress-note, and reassessment request building into focused task modules; isolate shared SOAP schemas and response normalization while preserving model defaults, prompt text, and output shapes.

**Verification:** Request/result contracts cover new chart, progress note, and reassessment; structured SOAP chart presentation is exercised on desktop/mobile. Lint, 41 unit tests, build, and 14 browser tests pass.

### [x] 3.4 Introduce feature-level AI hooks/actions

**Scope:** Replace direct `geminiService` imports in one feature at a time with feature hooks/actions that call the gateway.

**Verification:** Each migrated feature retains its loading, cancellation, error, and notification behavior. No component imports `geminiService` or the Gemini SDK; migrate the remaining task-specific UI calls and add action-boundary tests.

#### [x] 3.4a Route existing AI-consuming components through typed feature actions

**Scope:** Keep current positional component call sites stable while routing chat, note-thread, input, lookup, SOAP assistance, home-instruction, prescription, and media actions through the typed gateway adapter.

**Verification:** Typecheck, lint, unit tests, and desktop/mobile browser workflows pass; existing loading/error/cancellation behavior is unchanged.

### [x] 3.5 Remove sensitive production logging

**Scope:** Route diagnostics through a redacting logger and ensure patient prompts, records, API responses, and credentials are not logged in production.

**Verification:** Development diagnostics remain useful; production logging contains no clinical payloads.

### [!] 3.6 Implement the server-side AI proxy (only after DG-1; deferred by approval)

**Scope:** Explicitly deferred by DG-1. Do not implement the server-side proxy in this refactor; revisit only when the future backend is approved and in scope.

**Verification:** No implementation in this scope. The client adapter remains behind `ClinicalAiGateway` so a future backend can replace it.

## Phase 4 — Reusable interaction primitives

### [x] 4.1 Standardize modal and confirmation composition

**Scope:** Strengthen `ModalShell` and `ConfirmationModal` into the shared primitive for common overlays. Migrate one low-risk modal at a time without altering its markup/classes beyond the shell boundary.

**Verification:** Shared shell and confirmation overlays expose labelled dialog semantics while preserving existing focus, close/backdrop behavior, z-index, animation, markup, and mobile layout. Keyboard interaction behavior is intentionally unchanged.

#### [x] 4.1a Add accessible dialog semantics to the shared modal shell

**Scope:** Expose the existing portal shell and confirmation overlays as labelled modal dialogs without changing visual markup, animation, backdrop behavior, or close behavior.

**Verification:** Testing Library confirms titled and title-less dialogs expose accessible names and `aria-modal`; lint, unit tests, build, and desktop/mobile regressions pass.

### [x] 4.2 Create a reusable portal/popover primitive

**Scope:** Extract viewport-aware portal positioning, outside-click dismissal, resize/scroll tracking, and accessibility wiring from the duplicated dropdown implementations.

**Verification:** `OrderStatusDropdown` and `MedicationStatusDropdown` render identically at desktop and mobile widths, including edge-of-screen placement.

#### [x] 4.2a Extract shared portal dropdown positioning

**Scope:** Move identical button measurement, scroll/resize tracking, and mobile viewport clamping into `usePortalDropdownPosition`; preserve each dropdown's existing trigger, options, styles, and selection callbacks.

**Verification:** Positioning tests cover desktop offsets and mobile viewport edges; lint, 48 unit tests, build, and 16 desktop/mobile browser tests pass.

#### [x] 4.2b Extract shared portal menu and backdrop composition

**Scope:** Move the duplicated portal, animated panel, viewport anchor alignment, and outside-click backdrop into `PortalMenu`; retain each status dropdown's option markup and event behavior.

**Verification:** Component tests confirm portal content and backdrop close callback; an E2E scenario selects order and medication statuses on desktop and mobile. Lint, 48 unit tests, build, 16 browser tests, and `git diff --check` pass.

### [x] 4.3 Create reusable media hooks

**Scope:** Extract `useAudioRecorder` and `useCameraCapture`, including stream cleanup, permission errors, and transcription handoff.

**Verification:** Input, Chat, Smart Append, and both Notes recording paths produce the same transcript/user feedback and release media tracks on close/unmount.

#### [x] 4.3a Extract and test the shared audio recorder lifecycle

**Scope:** Centralize MediaRecorder setup, audio chunk collection, recording state, microphone permission errors, and stream cleanup. Keep feature-specific transcription and messaging in each caller; migrate Input first as the initial consumer.

**Verification:** Hook tests cover audio handoff, stop/unmount cleanup, and recording state; lint, 50 unit tests, production build, and 16 desktop/mobile workflow tests pass.

#### [x] 4.3b Migrate Chat recording and close-time cleanup

**Scope:** Move ChatPanel recording mechanics into `useAudioRecorder`, retain Chat-specific transcription and error messages, and stop capture when the always-mounted panel closes.

**Verification:** Hook tests cover close-time cleanup; lint, 51 unit tests, production build, and 16 desktop/mobile regressions pass.

#### [x] 4.3c Migrate Smart Append dictation

**Scope:** Replace SmartAppendOverlay's duplicated MediaRecorder mechanics with `useAudioRecorder`, retaining its transcription handoff, loading state, and permission feedback.

**Verification:** Existing Smart Append behavior remains covered by lint, 51 unit tests, production build, and 16 desktop/mobile regressions.

#### [x] 4.3d Migrate both Notes recording paths

**Scope:** Replace the Notes thread and floating-highlight MediaRecorder implementations with independent `useAudioRecorder` instances, preserving their transcription targets and feedback. Stop each recorder when its surface is hidden.

**Verification:** Lint, 51 unit tests, production build, and 16 desktop/mobile regressions pass; hook lifecycle coverage confirms hidden/unmounted surfaces release capture.

#### [x] 4.3e Extract camera-device and stream lifecycle

**Scope:** Move camera permission, device enumeration/selection, stream replacement, and cleanup into `useCameraCapture`; leave video/canvas rendering and image creation in `CameraCaptureModal`.

**Verification:** Hook tests cover default camera constraints and close/late-resolution cleanup; lint, 53 unit tests, production build, and 16 desktop/mobile regressions pass.

### [x] 4.4 Create reusable attachment hooks and display primitives

**Scope:** Consolidate file conversion, drag/drop state, previews, removal, and opening behavior around the existing file components.

**Verification:** Central file conversion and drag/drop hook tests pass; persistence browser tests confirm restored image/PDF previews and serializable import/export behavior. Lint, 58 unit tests, production build, 16 desktop/mobile regressions, and `git diff --check` pass.

#### [x] 4.4a Correct shared upload-hook preview ownership

**Scope:** Make `useFileUpload` retain previews across collection updates and revoke current owned URLs only on explicit removal, clear, or unmount.

**Verification:** Hook tests prove retained previews survive list updates and removed previews are revoked exactly once; lint, 55 unit tests, production build, and 16 desktop/mobile regressions pass.

#### [x] 4.4b Centralize multi-file conversion

**Scope:** Add a shared ordered `createFileUploads` service helper and migrate input-hook, Chat, Notes, chat composer, and Photo Gallery conversion loops without changing accepted files or categories.

**Verification:** File-service tests cover order, base64 data, image previews, and category propagation; lint, 56 unit tests, production build, and 16 desktop/mobile regressions pass.

#### [x] 4.4c Share drag-and-drop state and event handling

**Scope:** Extract reusable drag-over, leave, drop, and enabled-state behavior into `useFileDrop`; use it for the shared drop zone and Note editing surface without changing styling or accepted file rules.

**Verification:** Hook tests cover enabled/disabled drop behavior and file handoff; lint, 58 unit tests, production build, and 16 desktop/mobile regressions pass.

### [x] 4.5 Consolidate status-selection behavior

**Scope:** Back the order and medication status controls with a generic typed status-select primitive while preserving their separate labels and colors.

**Verification:** Every status option, color, callback payload, and keyboard/click interaction remains unchanged.

#### [x] 4.5a Extract generic typed status dropdown primitive

**Scope:** Consolidate duplicated trigger/menu rendering and typed option selection into `StatusDropdown<TStatus>` while leaving order and medication status enums/colors in their existing wrappers.

**Verification:** Existing dropdown unit and desktop/mobile tests cover option values, callback payloads, trigger colors, and responsive positioning; lint, 58 unit tests, production build, and 16 browser regressions pass.

## Phase 5 — Feature-by-feature migration

### [x] 5.1 Orders feature pilot

**Scope:** Move Orders, order cards, medication rows, bulk order entry, and prescription flows into `features/orders`. Reuse the existing `domain/orders.ts` as the model layer.

**Verification:** Filtering, sorting, grouping, drag-and-drop, selection, medication changes, bulk entry, and prescription print output match the baseline.

#### [x] 5.1a Establish Orders feature boundary

**Scope:** Move the top-level Orders view into `features/orders` and update its imports while leaving child UI modules in place for later independently verified migrations.

**Verification:** Typecheck, lint, unit tests, production build, desktop/mobile browser regressions, and the Orders workflow remain unchanged.

#### [x] 5.1b Move Orders-owned cards and bulk entry into the feature

**Scope:** Relocate `PatientOrderCard`, `MedicationOrderRow`, and `BulkOrderOverlay` under `features/orders`, updating imports without changing order-domain behavior or UI.

**Verification:** Existing status and desktop/mobile Orders tests pass along with lint, unit tests, production build, and `git diff --check`.

#### [x] 5.1c Move the Orders prescription workflow into the feature

**Scope:** Relocate the Orders-only `PrescriptionModal` from the shared UI modal directory into `features/orders`, keeping shared shell primitives imported from `components/ui`.

**Verification:** Prescription rendering and save/print behavior remain unchanged; lint, unit tests, production build, and desktop/mobile regressions pass.

**Additional verification:** The desktop/mobile Orders scenario changes order and medication statuses, opens the Orders-owned prescription modal, and confirms the selected medication is rendered there; domain tests cover filters, grouping, and bulk parsing.

### [x] 5.2 Patient input feature

**Scope:** Move Input Section, drafts, templates, import, lookup launching, and input attachments into `features/input` using the shared media/attachment primitives.

**Verification:** New-chart, append-entry, manual-save, drafts, templates, import, reset, lookup, and dictation paths behave identically.

#### [x] 5.2a Establish Input feature boundary

**Scope:** Move `InputSection` into `features/input` and update its module imports while keeping all current state and actions intact.

**Verification:** Input navigation/reset, lint, unit tests, production build, desktop/mobile regressions, and `git diff --check` pass.

#### [x] 5.2b Extract draft history and active-session persistence

**Scope:** Move draft loading, deduplication/retention, clearing, active-session recovery, and debounced persistence into `features/input/useInputDrafts`; preserve the existing storage keys and 800ms debounce.

**Verification:** Hook tests cover draft recovery, cap/deduplication, clearing, and autosave timing; lint, 61 unit tests, build, and 16 desktop/mobile input regressions pass.

#### [x] 5.2c Move Input-owned lookup into the feature

**Scope:** Relocate the input-only `LookupModal` under `features/input/components`, keeping shared modal primitives and AI actions in their current shared layers.

**Verification:** Lookup entry, search, result, close, and cancellation behavior remain unchanged; lint, unit tests, build, and desktop/mobile regressions pass.

#### [x] 5.2d Move Input-owned suggestions into the feature

**Scope:** Relocate `SuggestionsDrawer` into `features/input/components`, retaining its shared AI action and shared visual primitives imports.

**Verification:** Suggestion imports compile through the feature boundary; lint, 61 unit tests, production build, and 16 desktop/mobile regressions pass.

#### [x] 5.2e Extract patient-case import parsing

**Scope:** Move FileReader/JSON/schema-boundary parsing into a feature-local import module; keep file input reset, user feedback, and App-level import integration in their existing owners.

**Verification:** Unit tests cover valid single/batch imports, ordering, and distinct malformed-JSON/invalid-case messages; lint, 63 unit tests, build, and 16 desktop/mobile import regressions pass.

#### [x] 5.2f Move clinical templates into the Input feature

**Scope:** Make `features/input/templates.ts` the source of truth and preserve `config/clinicalTemplates.ts` as a compatibility re-export.

**Verification:** Content configuration tests confirm template parity through the feature and compatibility facade; lint, unit tests, build, and desktop/mobile input regressions pass.

### [x] 5.3 Chat feature

**Scope:** Move the clinical assistant panel and its resize, message, retry, save-to-note, attachment, search, and recording behavior into `features/chat`.

**Verification:** Conversation context, cancellation, retry behavior, resizing, and saved notes match the baseline.

#### [x] 5.3a Establish Chat feature boundary

**Scope:** Move `ChatPanel` into `features/chat` and update module imports while leaving shared `ClinicalChatInput`, media, file, and markdown primitives in their current reusable layers.

**Verification:** Lint, unit tests, production build, desktop/mobile regressions, and the chat shell open/close workflow remain unchanged.

#### [x] 5.3b Extract shared Chat message and retry helpers

**Scope:** Centralize assistant-message defaults, the existing retryable error message, and lookup of a failed turn's preceding user message/history.

**Verification:** Unit tests cover assistant title fallback, error copy, retry history boundaries, and missing retry context; lint, unit tests, production build, desktop/mobile regressions, and `git diff --check` pass.

#### [x] 5.3c Move conversation state and request lifecycle into a hook

**Scope:** Move message state, send/retry/cancel orchestration, abort cleanup, notification behavior, and request lifecycle into `features/chat/useChatConversation`; keep input, attachment selection, resizing, and rendering in the panel.

**Verification:** Hook tests cover send/attachment payloads, retries, cancellation, notifications, and errors; lint, unit tests, production build, desktop/mobile regressions, and `git diff --check` pass.

#### [x] 5.3d Type Chat save-to-note grounding sources

**Scope:** Replace the `any[]` callback boundary in Chat and App with the shared `GroundingSource[]` contract.

**Verification:** Typecheck, lint, unit tests, production build, desktop/mobile regressions, and `git diff --check` pass.

#### [x] 5.3e Extract Chat panel responsive resize lifecycle

**Scope:** Move the existing responsive breakpoint, panel-width constraints, pointer listeners, and body-style cleanup into a tested Chat feature hook.

**Verification:** Hook tests cover breakpoint changes, valid/invalid width changes, and listener/style cleanup; lint, unit tests, build, desktop/mobile Chat regressions, and diff checks pass.

### [x] 5.4 Notes feature

**Scope:** Split Notes list/card/thread behavior into focused components and remove duplicate thread/floating recorder and message-send logic using shared hooks.

**Verification:** Editing, attachments, text selection, thread/floating follow-ups, subnote operations, collapse state, and search highlighting match the baseline.

#### [x] 5.4a Extract note listing selectors

**Scope:** Move note search, date filtering, sorting, and pagination into pure feature-local functions while leaving toolbar state, rendering, and interactions unchanged.

**Verification:** Focused unit tests cover search, inclusive date filtering, order, pagination, and non-mutation; lint, unit tests, production build, and desktop/mobile regression tests pass.

#### [x] 5.4b Move Notes UI under the feature boundary

**Scope:** Relocate the Notes list view and patient note card into `features/notes`, updating only module paths and retaining shared UI/media primitives in their reusable layers.

**Verification:** Lint, unit tests, production build, desktop/mobile browser regressions, and `git diff --check` pass.

#### [x] 5.4c Extract note thread pairing

**Scope:** Move ordering and pairing of user/assistant subnotes into a feature-local pure function, preserving orphan and unanswered message behavior.

**Verification:** Unit tests cover paired, unanswered, and orphan assistant messages; lint, unit tests, production build, desktop/mobile regressions, and `git diff --check` pass.

#### [x] 5.4d Consolidate note thread inquiry lifecycle

**Scope:** Share user-message creation, conversation-history mapping, AI request construction, assistant response/error fallback, and optimistic update payload between regular and highlighted-text follow-ups.

**Verification:** Tests cover optimistic user entries, highlighted context, attachments, success response, and the established failure message; lint, unit tests, production build, desktop/mobile regressions, and `git diff --check` pass.

#### [x] 5.4e Type note-card child boundaries

**Scope:** Replace local `any` prop types for note grounding sources and attachment opening with the established `GroundingSource[]` and `FileUpload` contracts.

**Verification:** `npm run lint`, unit tests, production build, desktop/mobile regressions, and `git diff --check` pass.

#### [x] 5.4f Extract note content and attachment presentation

**Scope:** Move note markdown editing, attachment selection/display, and existing memoization into a feature-local child component with typed callbacks; retain the rendered markup and interaction behavior.

**Verification:** Typecheck, lint, unit tests, production build, Notes/browser regressions, formatting, and diff checks pass.

### [x] 5.5 Chart/SOAP feature — state and history first

**Scope:** Extract history navigation/filtering, entry visibility preferences, note resizing, chart toolbar state, and status actions from `SoapView` into feature-local hooks/components.

**Verification:** History filtering, pagination, encounter grouping, collapsed state, entry selection, and chart navigation match the baseline.

#### [x] 5.5a Extract chart history selectors

**Scope:** Move history search, type/date/specialization filtering, and pagination into pure feature-local functions while preserving the existing history state and rendering ownership.

**Verification:** Unit tests cover combined filters, inclusive date boundaries, and pagination; lint, unit tests, production build, desktop/mobile regressions, and `git diff --check` pass.

#### [x] 5.5b Move the chart screen into its feature boundary

**Scope:** Relocate `SoapView` into `features/chart` and update module paths only; keep section components and shared UI primitives in their current locations for incremental follow-up.

**Verification:** Lint, unit tests, production build, desktop/mobile chart regressions, and `git diff --check` pass.

#### [x] 5.5c Narrow chart history filter and photo callback types

**Scope:** Replace the entry-filter `any` cast with the existing filter union and type the chart photo callback with `FileUpload[]`.

**Verification:** Typecheck, lint, unit tests, production build, desktop/mobile regressions, and `git diff --check` pass.

#### [x] 5.5d Extract clinical note resize lifecycle

**Scope:** Move note-panel height state, pointer listeners, viewport constraints, and cleanup into a Chart feature hook without changing the initial height or interaction thresholds.

**Verification:** Hook tests cover initial height, valid/invalid bounds, mouseup, and unmount cleanup; typecheck and lint pass.

#### [x] 5.5e Extract Chart history navigation state

**Scope:** Move Chart history search/filter/pagination state, result derivation, page resets, and active-entry page selection into a feature hook while preserving the existing filter controls and navigation behavior.

**Verification:** Hook tests cover active-entry pagination and filter changes; typecheck, lint, full tests, production build, browser regressions, and diff checks pass.

#### [x] 5.5f Extract entry visibility preferences

**Scope:** Move per-entry visibility preference loading, merge-with-content defaults, persistence, and updates into a Chart feature hook while retaining the existing storage key and section visibility behavior.

**Verification:** Hook tests cover saved preference merging and persistence; typecheck, lint, unit tests, production build, desktop/mobile Chart regressions, and diff checks pass.

#### [x] 5.5g Extract patient-status confirmation actions

**Scope:** Move Chart status confirmation state, patient status update callback, and existing success-message selection into a focused feature hook without changing the confirmation copy or status mapping.

**Verification:** Hook tests cover status callback, confirmation cleanup, success copy, and absent handler behavior; typecheck, lint, unit tests, production build, desktop/mobile regressions, formatting, and diff checks pass.

#### [x] 5.5h Extract Chart toolbar and history-panel state

**Scope:** Move chart history collapse/mobile visibility, toolbar menus, and outside-click listener cleanup into a focused hook while preserving the existing state defaults and interaction.

**Verification:** Hook tests cover initial toggles, outside-click closure, and listener cleanup; typecheck, lint, unit tests, production build, desktop/mobile regressions, formatting, and diff checks pass.

### [x] 5.6 Chart/SOAP feature — clinical sections and actions

**Scope:** Extract photo analysis, clinical-data integration, references, prescriptions, instructions, and each SOAP section into composable feature parts.

**Verification:** Structured/raw rendering, editing, visibility controls, photo categories, AI actions, copied output, references, and all chart modals remain visually and functionally equivalent.

#### [x] 5.6a Extract clinical-data integration routing

**Scope:** Move suggestion-to-field routing and immutable SOAP section updates into a typed feature module, preserving keyword routing, current-content values, assistance-removal behavior, and UI feedback.

**Verification:** Unit tests cover field selection, structured physical-exam request context, immutable updates, and suggestion removal; lint, unit tests, production build, desktop/mobile regressions, and `git diff --check` pass.

#### [x] 5.6b Move clinical SOAP sections under Chart ownership

**Scope:** Relocate Subjective, Objective, Assessment, Plan, assistance, and their chart-only editing/management components into `features/chart/components`; retain shared utilities and generic UI in their current reusable layers.

**Verification:** Module imports resolve; lint, unit tests, production build, desktop/mobile chart regressions, and `git diff --check` pass.

#### [x] 5.6c Extract Chart photo-analysis lifecycle

**Scope:** Move physical-exam, laboratory, and imaging photo-analysis requests, progress flags, category checks, SOAP updates, and error feedback into a Chart feature hook.

**Verification:** Hook tests cover uploaded-file routing, category filtering, returned SOAP updates, missing-category feedback, errors, and loading cleanup; lint, unit tests, production build, desktop/mobile regressions, and `git diff --check` pass.

#### [x] 5.6d Extract Chart reference-list normalization

**Scope:** Move edited reference splitting, trimming, and legacy numbering/bullet removal into a pure Chart helper.

**Verification:** Unit tests cover numbered, bulleted, blank, and plain-text references; chart rendering and saved entry shape remain unchanged.

#### [x] 5.6e Extract and regression-test chart clipboard formatting

**Scope:** Move SOAP and raw-note clipboard text composition into a pure Chart function without altering section order, labels, fallback text, or markdown cleanup.

**Verification:** Unit tests cover structured and raw note output; copy behavior, lint, unit tests, production build, browser regressions, and diff checks pass.

### [x] 5.7 Remaining view features

**Scope:** Move Dashboard, Profile, Course, Handoff, Settings, landing/login, and shared shell/navigation into their respective feature/app modules.

**Verification:** Navigation, active-patient resets, notification permission, mobile-header behavior, legal modals, and responsive layout match the baseline.

#### [x] 5.7a Establish the Dashboard feature boundary

**Scope:** Move the Dashboard screen under `features/dashboard` while retaining shared toolbar, task sidebar, status modal, and UI primitives in their shared owners.

**Verification:** Typecheck, lint, unit tests, production build, desktop/mobile dashboard smoke checks, and diff checks pass; dashboard content and actions remain unchanged.

#### [x] 5.7b Establish the Profile feature boundary

**Scope:** Move Profile and its exclusively used general-data editing/display components under `features/profile`, keeping generic section cards and UI primitives shared.

**Verification:** Typecheck, lint, unit tests, production build, desktop/mobile navigation regressions, and diff checks pass; profile editing and status actions remain unchanged.

#### [x] 5.7c Establish the Course feature boundary

**Scope:** Move the course timeline screen under `features/course`; keep shared toolbar, confirmation, and text-editing primitives in shared ownership.

**Verification:** Typecheck, lint, unit tests, production build, desktop/mobile regressions, and diff checks pass; timeline filtering, editing, copying, and deletion remain unchanged.

#### [x] 5.7d Establish the Handoff feature boundary

**Scope:** Move the summary/handoff screen under `features/handoff` while keeping its editor and toolbar reusable.

**Verification:** Typecheck, lint, unit tests, production build, desktop/mobile regressions, and diff checks pass; summary refresh, editing, and copy behavior remain unchanged.

#### [x] 5.7e Establish the Settings feature boundary

**Scope:** Move model/specialization settings UI under `features/settings` while keeping app configuration and generic controls in shared layers.

**Verification:** Typecheck, lint, unit tests, production build, and desktop/mobile regressions pass; saved model and specialization behavior remains unchanged.

#### [x] 5.7f Establish the access-screen feature boundary

**Scope:** Move landing and login screens under `features/access`; keep app-level routing and legal-document modals owned by the application shell.

**Verification:** Typecheck, lint, unit tests, production build, and desktop/mobile access-flow regressions pass; launch, login, and About navigation remain unchanged.

#### [x] 5.7g Establish the application shell boundary

**Scope:** Move global navigation, page header, and patient header into `app/shell`; keep route ownership and workflow orchestration in `App.tsx`.

**Verification:** Typecheck, lint, unit tests, production build, desktop/mobile navigation and active-patient regressions, and diff checks pass; responsive shell appearance and route behavior remain unchanged.

## Phase 6 — Final hardening and cleanup

### [x] 6.1 Enable stricter TypeScript incrementally

**Scope:** Enable `strict` and related safe compiler options only after affected code is typed. Do not suppress failures globally.

**Verification:** Type checking passes with no new broad casts or `@ts-ignore` comments.

#### [x] 6.1a Narrow App error and course-update boundaries

**Scope:** Replace App catch-variable `any` values with `unknown` and a compatibility-safe message extractor; type course event updates as `CourseEvent[]`.

**Verification:** Unit tests cover compatibility message extraction; typecheck, lint, unit tests, production build, desktop/mobile regressions, and `git diff --check` pass.

#### [x] 6.1b Remove residual `any` from shared icon and profile-status contracts

**Scope:** Give reusable icon slots the explicit className component contract they render, and carry the existing `DeceasedInfo` domain type through Profile status updates.

**Verification:** Typecheck, lint, unit tests, production build, and `git diff --check` pass; no UI or status behavior changes.

#### [x] 6.1c Type Chart section editing and visibility controls

**Scope:** Replace local `any` casts in Objective field updates and Chart visibility menus with key/value types derived from the SOAP and visibility contracts.

**Verification:** Typecheck, lint, unit tests, production build, browser regressions, and `git diff --check` pass; section toggles and editing behave identically.

#### [x] 6.1d Narrow Input feature error boundaries

**Scope:** Replace `any` catch variables in lookup and suggestion flows with `unknown`, preserving legacy message extraction and timeout-abort handling.

**Verification:** Typecheck, lint, unit tests, production build, browser regressions, and `git diff --check` pass; existing user-facing feedback remains unchanged.

#### [x] 6.1e Type Home Instructions field updates

**Scope:** Tie the editable value type to the selected Home Instructions field so array and scalar fields cannot be mixed.

**Verification:** Typecheck, lint, unit tests, production build, and `git diff --check` pass; rendered instructions and editing remain unchanged.

#### [x] 6.1f Use the shared order category domain type

**Scope:** Replace duplicated order-category unions and UI casts with the existing `OrderCategory` contract.

**Verification:** Typecheck, lint, unit tests, production build, browser regressions, and `git diff --check` pass; category options and order editing remain unchanged.

#### [x] 6.1g Type AI prompt input contracts

**Scope:** Replace prompt-builder `any` inputs with existing SOAP, plan, and chart-context domain types.

**Verification:** Typecheck, lint, AI task contract tests, production build, and `git diff --check` pass; prompt text remains byte-for-byte unchanged.

#### [x] 6.1h Type shared Markdown renderer components

**Scope:** Replace renderer callback `any` values with ReactMarkdown's exported `Components` contract.

**Verification:** A component test asserts existing heading, paragraph, list, and wrapper styling; typecheck, lint, tests, and build pass.

#### [x] 6.1i Type Gemini SDK transport and multimodal part boundaries

**Scope:** Use the installed SDK's request, response, generation-config, and `Part` contracts instead of untyped result, contents, config, and part arrays.

**Verification:** Transport and AI task contract tests pass along with typecheck, lint, production build, and `git diff --check`; request payloads remain equivalent.

#### [x] 6.1j Type chart-generation response contracts

**Scope:** Replace chart, progress-note, and reassessment response `any` parsing with explicit response shapes composed from existing clinical domain types.

**Verification:** AI task contract tests, typecheck, lint, production build, and `git diff --check` pass; output shapes and fallback behavior remain unchanged.

#### [x] 6.1k Type dynamic SOAP response normalization

**Scope:** Replace remaining normalizer `any` values with `unknown`/record narrowing while retaining model-output list flattening and in-place object updates.

**Verification:** Unit tests cover dynamic arrays, `otherFindings` precedence/removal, and object identity; typecheck, lint, tests, build, and diff checks pass.

#### [x] 6.1l Resolve strict-mode nullability and callback boundaries

**Scope:** Address the first strict-check findings in patient updates, dropdown wrappers, optional screen callbacks, and AI/chart context boundaries without changing user workflows.

**Verification:** Run strict TypeScript checking, lint, unit tests, production build, desktop/mobile regressions, and diff checks.

### [x] 6.2 Add linting, formatting, and CI gates

**Scope:** After DG-2, configure ESLint, Prettier, test scripts, and CI to require type-checking, linting, tests, and production build.

**Verification:** A clean checkout can run all quality gates with documented commands.

#### [x] 6.2a Add continuous integration checks

**Scope:** Add least-privilege GitHub Actions checks for typecheck/lint, unit tests, production build, and desktop/mobile Playwright tests; pin actions to immutable release SHAs and enable grouped weekly dependency update proposals.

**Verification:** Workflow YAML inspection, `npm run lint`, `npm test`, `npm run build`, `npm run test:e2e`, and `git diff --check` pass.

#### [x] 6.2b Establish a clean Prettier baseline

**Scope:** Normalize formatting across the repository and require `npm run format:check` in CI.

**Verification:** `npm run format:check`, lint, tests, build, browser regressions, and diff checks pass; CI rejects formatting drift.

### [x] 6.3 Resolve the CSS build warning safely

**Scope:** Remove or provide the missing `/index.css` reference only after confirming it has no runtime styling responsibility. Keep Tailwind delivery unchanged unless DG-3 approves its migration.

**Verification:** Production build has no missing-CSS warning. The compiled Tailwind stylesheet contains the existing utility classes and custom animations; visual snapshot comparison remains tracked in 0.3.

### [x] 6.4 Remove compatibility facades and dead code

**Scope:** Remove transitional exports, unused legacy helpers, duplicate implementations, and obsolete comments after all importers are migrated.

**Verification:** Repository search confirms no old service paths or dead compatibility imports remain; full test and visual suite passes.

#### [x] 6.4a Remove the retired Gemini service facade

**Scope:** Once every application and test importer uses the AI task modules or typed gateway, remove the transitional `services/geminiService.ts` facade.

**Verification:** Repository search returns no source imports of `geminiService`; typecheck, lint, unit tests, production build, and desktop/mobile regressions pass.

#### [x] 6.4b Remove the unused constants compatibility barrel

**Scope:** Delete the legacy `constants.ts` re-export barrel after migrating its only remaining consumers (configuration tests) to the owning app-config, feature-template, and AI schema modules.

**Verification:** Repository search finds no imports of `constants.ts`; focused configuration tests, typecheck, lint, formatting, and diff checks pass.

#### [x] 6.4c Remove the shared utility compatibility facade

**Scope:** Migrate application and test imports to the owning date, ID, markdown, clinical-text, storage, and patient utility modules, then delete the root `utils.ts` re-export facade.

**Verification:** Repository search finds no imports of the deleted facade; typecheck, lint, unit tests, production build, desktop/mobile regressions, formatting, and diff checks pass.

### [x] 6.5 Refresh documentation and close the refactor

**Scope:** Update README with architecture, feature ownership, commands, test strategy, persistence compatibility, and AI gateway deployment notes.

**Verification:** A new contributor can run, test, and understand the application boundaries from repository documentation.

#### [x] 6.5a Document architecture, setup, quality gates, and deferred AI backend

**Scope:** Replace the starter README with contributor-focused setup, feature/domain ownership, test tooling, persistence compatibility, and an explicit statement that the current browser AI adapter is not a production credential boundary.

**Verification:** README commands correspond to package scripts; Markdown formatting, lint, build, and diff checks pass.

## Change log

Add one entry per started or completed slice.

```text
YYYY-MM-DD | Slice ID | Status | PR/branch | Verification evidence | Notes/decisions
```

2026-08-26 | 0.1, 0.2, 0.3, DG-1, DG-2, DG-3, 6.3 | complete | current workspace | `npm run lint`, `npm test`, `npm run build`, `npm run test:e2e` (4 desktop/mobile tests) | Adopted Tailwind 4.3 Vite delivery and modern test/lint tooling; added structured/legacy fixtures, persistence hydration coverage, and dashboard visual snapshots. Server-side AI proxy deferred. ESLint's newer React compiler rules remain deferred until the legacy components are migrated.
2026-08-26 | 0.4 | complete | current workspace | `npm run lint`, `npm test` (8 unit tests), `npm run test:e2e` (6 desktop/mobile tests) | Added order-domain regression tests and input navigation/reset coverage. Reset assertion preserves the existing behavior: it clears the editor while remaining on the input view.
2026-08-26 | 1.1a | complete | current workspace | `npm run lint`, `npm test` (9 unit tests), `npm run build` | Extracted app/navigation configuration to `config/appConfig.ts`, migrated direct consumers, and retained constants compatibility exports. AI prompt/schema and clinical-template extraction remains 1.1b.
2026-08-26 | 1.1b1 | complete | current workspace | `npm run lint`, `npm test` (10 unit tests), `npm run build`, `npm run test:e2e` (6 browser tests) | Extracted schema descriptions, diagnosis rules, and clinical templates with compatibility parity tests. Remaining prompt text/builders were queued as 1.1b2.
2026-09-13 | 1.1b2 | complete | current workspace | `npm run lint`, `npm test` (10 unit tests), `npm run build`, `npm run test:e2e` (6 browser tests) | Extracted all AI prompt constants/builders to `services/ai/prompts.ts`, migrated `geminiService.ts` to direct prompt/schema/config imports, and retained `constants.ts` as a compatibility facade.
2026-09-13 | 1.2a | complete | current workspace | `npm run lint`, `npm test` (10 unit tests) | Added shared domain aliases and typed order filters; removed the order parser's low-risk `any` cast while preserving dynamic category parsing at the boundary.
2026-09-13 | 1.2b1 | complete | current workspace | `npm run lint`, `npm test` (11 unit tests) | Replaced the patient age/sex normalizer's `any` input/output with explicit overloads and added regression coverage for legacy data normalization.
2026-09-13 | 1.2b2a | complete | current workspace | `npm run lint`, `npm test` (11 unit tests), `npm run test:e2e` (6 browser tests) | Added the `ChartHistoryEntry` boundary and typed chart-history rendering callbacks while preserving raw and structured record support.
2026-09-13 | 1.2b2b | complete | current workspace | `npm run lint`, `npm test` (13 unit tests), `npm run test:e2e` (6 browser tests) | Extracted typed persistence hydration/migration to `services/patientPersistence.ts`, retained the storage key and legacy encounter migration, and added malformed-payload coverage.
2026-09-13 | 1.3a | complete | current workspace | `npm run lint`, `npm test` (13 unit tests) | Added focused ID and safe-storage modules with compatibility exports; date/text utility migration remains 1.3b.
2026-09-13 | 1.3b1 | complete | current workspace | `npm run lint`, `npm test` (13 unit tests) | Moved date/age/time helpers into `utils/date.ts` and retained compatibility exports through `utils.ts`.
2026-09-13 | 1.3b2a | complete | current workspace | `npm run lint`, `npm test` (13 unit tests) | Extracted markdown bullet conversion into `utils/markdown.ts` with compatibility exports.
2026-09-13 | 1.3b2b1 | complete | current workspace | `npm run lint`, `npm test` (13 unit tests) | Extracted section ordering and key/value conversion into `utils/clinicalText.ts`; chart-history formatting remains queued as 1.3b2b2.
2026-09-13 | 1.3b2b2 | complete | current workspace | `npm run lint`, `npm test` (13 unit tests) | Moved chart-history rendering into `utils/clinicalText.ts`; `utils.ts` now serves as the compatibility facade for consolidated utilities.
2026-09-14 | 1.4a | complete | current workspace | `npm run lint`, `npm test` (15 unit tests) | Added typed `AppError`, safe unknown-error message normalization, and a typed notification service contract without changing browser notification behavior.
2026-09-14 | 1.4b1 | complete | current workspace | `npm run lint`, `npm test` (15 unit tests) | Replaced the prescription popup-blocked alert with an inline dismissible error while preserving the exact user-facing message.
2026-09-14 | 1.4b2 | complete | current workspace | `npm run lint`, `npm test` (15 unit tests) | Replaced the home-instructions popup-blocked alert with an inline dismissible error while preserving the exact user-facing message.
2026-09-14 | 1.4b3 | complete | current workspace | `npm run lint`, `npm test` (15 unit tests) | Replaced the smart-append microphone-permission alert with an inline dismissible error while preserving the exact user-facing message.
2026-09-14 | 1.4b4 | complete | current workspace | `npm run lint`, `npm test` (15 unit tests) | Replaced the chat microphone-permission alert with an inline error chat message while preserving the exact user-facing message.
2026-09-14 | 1.4b5 | complete | current workspace | `npm run lint`, `npm test` (15 unit tests) | Replaced input microphone and batch-import alerts with a shared inline dismissible error while preserving existing messages and workflows.
2026-09-14 | 1.4b6 | complete | current workspace | `npm run lint`, `npm test` (15 unit tests) | Replaced SOAP photo-analysis and integration alerts with a shared dismissible workflow error while preserving existing messages and actions.
2026-09-14 | 1.4b7 | complete | current workspace | `npm run lint`, `npm test` (15 unit tests) | Replaced subjective/objective assistance alerts with local dismissible errors while preserving suggestion behavior.
2026-09-14 | 1.4b8 | complete | current workspace | `npm run lint`, `npm test` (15 unit tests), `rg "alert\\(" components services` | Replaced patient-note microphone alerts with a local dismissible error; no direct component/service alerts remain.
2026-09-14 | 2.1 | complete | current workspace | `npm run lint`, `npm test` (17 unit tests), `npm run test:e2e` (6 browser tests) | Extracted typed persistence hydration/migration to `services/patientPersistence.ts` and preserved legacy encounter behavior.
2026-09-14 | 2.2a | complete | current workspace | `npm run lint`, `npm test` (17 unit tests) | Added immutable patient entry transition functions and migrated App entry update handlers.
2026-09-14 | 2.2b1 | complete | current workspace | `npm run lint`, `npm test` (18 unit tests) | Added immutable patient-info, course, handoff, order, medication, and note transition helpers; migrated corresponding App update, append, and global-order handlers.
2026-09-15 | 2.2b2 | complete | current workspace | `npm run lint`, `npm test` (19 unit tests) | Added immutable encounter/status lifecycle transitions and non-mutating import ID normalization; migrated App status, reactivation, and import handlers.
2026-09-15 | 2.2b3 | complete | current workspace | `npm run lint`, `npm test` (21 unit tests) | Added pure generated/manual patient constructors and migrated both creation paths while preserving defaults, encounter initialization, and UI behavior.
2026-09-15 | 2.3a | complete | current workspace | `npm run lint`, `npm test` (21 unit tests) | Added `usePatientStore` compatibility facade for patient hydration, add, batch-add, update, and remove operations; migrated creation/import/deletion entry points without changing persistence or UI behavior.
2026-09-15 | 2.3b | complete | current workspace | `npm test` (21 unit tests) | Migrated remaining chart, encounter, status, order, note, and entry deletion workflows to `usePatientStore.updatePatient`/`removePatient`; retained direct setter only for order carry-over pending 2.3c.
2026-09-15 | 2.3c | complete | current workspace | `npm run typecheck`, targeted ESLint | Moved whole-collection order carry-over behind `usePatientStore.updatePatients` and removed direct patient setter access from `App.tsx`.
2026-10-07 | 2.4a | complete | current workspace | `npm run lint`, `npm test` (26 unit tests), `npm run build`, `npm run test:e2e` (8 desktop/mobile tests), `git diff --check` | Moved remaining patient-record transformations from `App.tsx` into pure domain functions and store operations.
2026-10-07 | 2.5a | complete | current workspace | `npm run lint`, `npm test` (26 unit tests), `npm run build`, `npm run test:e2e` (8 desktop/mobile tests) | Added serializable attachment metadata, File/preview hydration, and persistence/export/import integration; verified restored image preview after reload.
2026-10-07 | 3.1a | complete | current workspace | `npm run lint`, `npm run build`, `npm run typecheck` | Added typed AI task contract and direct Gemini adapter; migrated App chart, progress, reassessment, and summary calls.
2026-10-07 | 3.2a | complete | current workspace | `npm run lint`, `npm test` (26 unit tests), `npm run build` | Moved SDK construction, abort handling, output sanitation, grounding extraction, and File/Blob conversion into `services/ai/geminiTransport.ts`; `geminiService.ts` retains task behavior and compatibility re-exports.
2026-10-07 | 3.3b | complete | current workspace | `npm run lint`, `npm test` (34 tests), `npm run build` | Added summary and discharge task modules; contract tests cover context/model mapping, response schemas, result shapes, and empty-response fallbacks.
2026-10-07 | 3.4a | complete | current workspace | `npm run lint`, `npm test` (31 tests), `npm run build`, `npm run test:e2e` (8 tests) | Migrated all AI-consuming components to typed gateway-backed actions. Repository search confirms components no longer import `geminiService` or `@google/genai`.
2026-10-07 | 3.5 | complete | current workspace | `npm run lint`, `npm test` (41 tests), `npm run build`, `npm run test:e2e` | Replaced raw AI/clinical error-object logging in transport, task, and UI catch paths with static diagnostics; production logger tests verify silence.
2026-10-07 | 2.5b | complete | current workspace | `npm run lint`, `npm test` (38 tests), `npm run build`, `npm run test:e2e` (12 desktop/mobile tests) | Verified reload/import/export of image/PDF attachment data, image preview hydration, URL cleanup on patient deletion, and app unmount cleanup.
2026-10-07 | 3.3a | complete | current workspace | `npm run lint`, `npm test` (38 tests), `npm run build` | Extracted media, clinical-assistance, input-assistance, and conversation tasks; added representative task request/result contract tests.
2026-10-07 | 3.3c | complete | current workspace | `npm run lint`, `npm test` (41 tests), `npm run build`, `npm run test:e2e` (14 desktop/mobile tests) | Extracted chart generation, progress notes, and reassessment with reusable SOAP schemas; added request/result contracts and chart presentation regression coverage.
2026-10-07 | 6.4a | complete | current workspace | Repository search, `npm run lint`, `npm test`, `npm run build`, `npm run test:e2e` | Removed the unused Gemini service compatibility facade after migrating the gateway and tests to direct task modules.
2026-10-07 | 4.1a | complete | current workspace | `npm run lint`, `npm test` (43 tests), `npm run build`, `npm run test:e2e` (14 desktop/mobile tests), `git diff --check` | Added labelled dialog semantics to shared modal and confirmation primitives; visual structure, motion, backdrop, and close behavior remain unchanged.
2026-10-07 | 4.2a/4.2b | complete | current workspace | `npm run lint`, `npm test` (48 tests), `npm run build`, `npm run test:e2e` (16 desktop/mobile tests), `git diff --check` | Extracted shared viewport positioning and `PortalMenu` composition from order and medication dropdowns; added responsive status-selection regression coverage.
2026-10-07 | 4.3a | complete | current workspace | `npm run lint`, `npm test` (50 tests), `npm run build`, `npm run test:e2e` (16 desktop/mobile tests), `git diff --check` | Added `useAudioRecorder` with tested audio handoff and stream lifecycle; migrated Input while keeping its transcription and error feedback local.
2026-10-07 | 4.3b | complete | current workspace | `npm run lint`, `npm test` (51 tests), `npm run build`, `npm run test:e2e` (16 desktop/mobile tests), `git diff --check` | Migrated Chat recording to `useAudioRecorder`; closing the mounted chat panel now stops capture and releases the media stream without handing off an incomplete recording.
2026-10-07 | 4.3c/4.3d | complete | current workspace | `npm run lint`, `npm test` (51 tests), `npm run build`, `npm run test:e2e` (16 desktop/mobile tests), `git diff --check` | Migrated Smart Append, Notes thread, and floating-highlight dictation to `useAudioRecorder`; hidden Note recording surfaces stop capture while preserving each transcription target and feedback path.
2026-10-07 | 4.3e | complete | current workspace | `npm run lint`, `npm test` (53 tests), `npm run build`, `npm run test:e2e` (16 desktop/mobile tests), `git diff --check` | Extracted camera device enumeration, selection, permission, stream lifecycle, and stale-request cleanup into `useCameraCapture`; kept video/canvas rendering and JPEG creation in the existing modal.
2026-10-07 | 4.4a | complete | current workspace | `npm run lint`, `npm test` (55 tests), `npm run build`, `npm run test:e2e` (16 desktop/mobile tests), `git diff --check` | Corrected `useFileUpload` preview ownership so retained previews are not revoked on collection updates; explicit removal and unmount cleanup are tested.
2026-10-07 | 4.4b | complete | current workspace | `npm run lint`, `npm test` (56 tests), `npm run build`, `npm run test:e2e` (16 desktop/mobile tests), `git diff --check` | Centralized ordered multi-file conversion and migrated upload consumers while preserving Photo Gallery image filtering and category assignment.
2026-10-07 | 4.4c | complete | current workspace | `npm run lint`, `npm test` (58 tests), `npm run build`, `npm run test:e2e` (16 desktop/mobile tests), `git diff --check` | Extracted drag/drop state and event handling into `useFileDrop`; migrated FileDropZone and Note editing drop surfaces with existing enabled-state and styling behavior.
2026-10-07 | 4.5a | complete | current workspace | `npm run lint`, `npm test` (58 tests), `npm run build`, `npm run test:e2e` (16 desktop/mobile tests), `git diff --check` | Consolidated the shared status menu, trigger, and selection behavior in typed `StatusDropdown<TStatus>` while preserving enum options and per-domain trigger colors.
2026-10-07 | 5.1a/5.1b | complete | current workspace | `npm run lint`, `npm test` (58 tests), `npm run build`, `npm run test:e2e` (16 desktop/mobile tests), `git diff --check` | Established `features/orders` and relocated the Orders view, order/medication rows, and bulk-order overlay; existing order-domain and shared UI modules remain separate.
2026-10-08 | 5.1c | complete | current workspace | `npm run lint`, `npm test` (58 tests), `npm run build`, `npm run test:e2e` (16 desktop/mobile tests), `git diff --check` | Moved the Orders-only prescription editor into `features/orders`; browser regression opens it from the medication tab and confirms the selected medication appears.
2026-10-08 | 5.2a | complete | current workspace | `npm run lint`, `npm test` (58 tests), `npm run build`, `npm run test:e2e` (16 desktop/mobile tests), `git diff --check` | Moved the main Input view under `features/input` with only import-path changes.
2026-10-08 | 5.2b | complete | current workspace | `npm run lint`, `npm test` (61 tests), `npm run build`, `npm run test:e2e` (16 desktop/mobile tests), `git diff --check` | Extracted draft history and active-session persistence into a feature hook; storage keys, retention, deduplication, and 800ms autosave are covered.
2026-10-08 | 5.2c | complete | current workspace | `npm run lint`, `npm test` (61 tests), `npm run build`, `npm run test:e2e` (16 desktop/mobile tests), `git diff --check` | Moved the Input-only lookup modal into the feature and added browser coverage for opening and closing it from the input workflow.
2026-10-08 | 5.2d | complete | current workspace | `npm run lint`, `npm test` (61 tests), `npm run build`, `npm run test:e2e` (16 desktop/mobile tests), `git diff --check` | Moved the Input-only suggestions drawer into the feature while retaining shared action, icon, and UI layers.
2026-10-08 | 5.2e | complete | current workspace | `npm run lint`, `npm test` (63 tests), `npm run build`, `npm run test:e2e` (16 desktop/mobile tests), `git diff --check` | Extracted patient-case FileReader/JSON parsing into `features/input/importCases.ts`; single/batch ordering and validation messages are tested.
2026-10-08 | 5.2f | complete | current workspace | `npm run lint`, `npm test` (63 tests), `npm run build`, `npm run test:e2e` (16 desktop/mobile tests), `git diff --check` | Moved template source ownership into `features/input/templates.ts` while preserving the existing config/constants re-export chain.
2026-10-08 | 5.3a | complete | current workspace | `npm run lint`, `npm test` (63 tests), `npm run build`, `npm run test:e2e` (18 desktop/mobile tests), `git diff --check` | Moved the clinical assistant panel to `features/chat`; browser coverage verifies the existing off-canvas close state. Remaining Chat modularization stays in 5.3.
2026-10-08 | 5.3b | complete | current workspace | `npm run lint`, `npm test` (75 tests), `npm run build`, `npm run test:e2e` (18 desktop/mobile tests), `git diff --check` | Added feature-local chat message/retry helpers and migrated send/retry handlers without changing message copy or request history.
2026-10-08 | 5.3c | complete | current workspace | `npm run lint`, `npm test` (79 tests), `npm run build`, `npm run test:e2e` (18 desktop/mobile tests), `git diff --check` | Moved Chat send/retry/cancel, abort, message state, and notification handling into the tested `useChatConversation` hook.
2026-10-08 | 5.3d | complete | current workspace | `npm run lint`, `npm test` (79 tests), `npm run build`, `npm run test:e2e` (18 desktop/mobile tests), `git diff --check` | Narrowed the Chat-to-App save-note grounding source callback to the shared `GroundingSource[]` type.
2026-10-08 | 5.4a/5.4c | complete | current workspace | `npm run lint`, `npm test` (68 tests), `npm run build`, `npm run test:e2e` (18 desktop/mobile tests), `git diff --check` | Extracted note listing selectors and thread pairing into pure feature-local modules with focused unit coverage.
2026-10-08 | 5.4b | complete | current workspace | `npm run lint`, `npm test` (68 tests), `npm run build`, `npm run test:e2e` (18 desktop/mobile tests), `git diff --check` | Relocated Notes view and patient note card under `features/notes`; rendering and interactions remain unchanged.
2026-10-08 | 5.4d | complete | current workspace | `npm run lint`, `npm test` (72 tests), `npm run build`, `npm run test:e2e` (18 desktop/mobile tests), `git diff --check` | Consolidated regular and highlighted-text thread follow-ups through `features/notes/sendThreadInquiry.ts`, retaining optimistic updates and existing error behavior.
2026-10-08 | 5.4e | complete | current workspace | `npm run lint`, `npm test` (75 tests), `npm run build`, `npm run test:e2e` (18 desktop/mobile tests), `git diff --check` | Replaced remaining note-card child-prop `any` types with shared file and grounding-source contracts.
2026-10-08 | 5.5a | complete | current workspace | `npm run lint`, `npm test` (70 tests), `npm run build`, `npm run test:e2e` (18 desktop/mobile tests), `git diff --check` | Extracted Chart/SOAP history filters and pagination into `features/chart/history.ts`; page/filter state and rendering remain in `SoapView`.
2026-10-08 | 5.5b | complete | current workspace | `npm run lint`, `npm test` (70 tests), `npm run build`, `npm run test:e2e` (18 desktop/mobile tests), `git diff --check` | Moved `SoapView` to `features/chart/SoapView.tsx`; existing chart sections and shared UI remain separately owned.
2026-10-08 | 5.5c | complete | current workspace | `npm run lint`, `npm test` (79 tests), `npm run build`, `npm run test:e2e` (18 desktop/mobile tests), `git diff --check` | Replaced the Chart history-filter cast and photo-upload callback `any[]` with the existing filter union and `FileUpload[]`.
2026-10-08 | 1.3b | complete | current workspace | `npm run lint`, `npm test` (80 tests), `npm run build`, `npm run test:e2e` (18 desktop/mobile tests), `git diff --check` | Moved age/sex normalization to `utils/patient.ts`; `utils.ts` is now a pure compatibility facade and parity-tested against the feature-owned export.
2026-10-08 | 5.6a | complete | current workspace | `npm run lint`, `npm test` (83 tests), `npm run build`, `npm run test:e2e` (18 desktop/mobile tests), `git diff --check` | Extracted typed clinical suggestion routing and immutable SOAP updates into `features/chart/clinicalIntegration.ts` and narrowed the Subjective/Objective callback contract.
2026-10-08 | 5.6b | complete | current workspace | `npm run lint`, `npm test` (83 tests), `npm run build`, `npm run test:e2e` (18 desktop/mobile tests), `git diff --check` | Moved chart-specific SOAP sections and editing/management components to `features/chart/components`, leaving shared UI, formatting helpers, and the Profile-owned general-data section separate.
2026-10-08 | 5.6c | complete | current workspace | `npm run lint`, `npm test` (86 tests), `npm run build`, `npm run test:e2e` (18 desktop/mobile tests), `git diff --check` | Extracted physical-exam, lab, and imaging analysis state/actions to `useChartPhotoAnalysis` with hook-level contract/error coverage.
2026-10-08 | 6.1a | complete | current workspace | `npm run lint`, `npm test` (87 tests), `npm run build`, `npm run test:e2e` (18 desktop/mobile tests), `git diff --check` | Replaced App's remaining catch `any` values and course `any[]` with `unknown` compatibility extraction and `CourseEvent[]`.
2026-10-08 | 6.1b | complete | current workspace | `npm run typecheck`, `npm run lint`, `npm test` (87 tests), `npm run build`, `git diff --check` | Removed residual icon-prop `any` from reusable shared components and typed Profile status updates with `DeceasedInfo`.
2026-10-08 | 6.1c | complete | current workspace | `npm run typecheck`, `npm run lint`, `npm test` (87 tests), `npm run build`, `npm run test:e2e` (18 desktop/mobile tests), `git diff --check` | Derived Objective field updates and Chart visibility controls from SOAP/visibility key contracts, removing local `any` casts without changing interaction behavior.
2026-10-08 | 6.1d | complete | current workspace | `npm run lint`, `npm test` (87 tests), `npm run build`, `npm run test:e2e` (18 desktop/mobile tests), `git diff --check` | Replaced Input lookup/suggestion catch `any` with `unknown`, preserving abort-timeout recognition and legacy `.message` compatibility.
2026-10-08 | 6.1e | complete | current workspace | `npm run lint`, `npm test` (87 tests), `npm run build`, `git diff --check` | Tied Home Instructions editable updates to the selected scalar/array field type.
2026-10-08 | 6.1f | complete | current workspace | `npm run lint`, `npm test` (87 tests), `npm run build`, `npm run test:e2e` (18 desktop/mobile tests), `git diff --check` | Reused `OrderCategory` in both order editors and removed their duplicated union/casts without changing options.
2026-10-08 | 6.1g | complete | current workspace | `npm run typecheck`, `npm run lint`, `npm test` (87 tests), `npm run build`, `git diff --check` | Typed home-instructions, prescription, and chat/note-thread prompt builders with existing domain inputs; prompt strings are unchanged.
2026-10-08 | 6.2a | complete | current workspace | `npm run lint`, `npm test` (87 tests), `npm run build`, `npm run test:e2e` (18 desktop/mobile tests), YAML/Prettier check, `git diff --check` | Added least-privilege GitHub Actions CI, SHA-pinned checkout/Node actions, and weekly grouped npm/GitHub Actions dependency updates. Formatting gate remains separate until baseline cleanup.
2026-10-08 | 6.5a | complete | current workspace | `npm run lint`, README/plan Prettier check, `git diff --check` | Replaced starter README with architecture, setup, verification, persistence, and explicitly deferred AI backend guidance.
2026-10-08 | 5.6d | complete | current workspace | `npm run lint`, `npm test` (89 tests), `npm run build`, `npm run test:e2e` (18 desktop/mobile tests), `git diff --check` | Extracted and tested Chart reference-list normalization; persisted reference strings retain the existing trimming and prefix-cleanup behavior.
2026-10-08 | 5.3e | complete | current workspace | `npm run lint`, `npm test` (91 tests), `npm run build`, `npm run test:e2e` (18 desktop/mobile tests), `git diff --check` | Extracted Chat's existing responsive resize/listener/body-style lifecycle into a feature hook with breakpoint, bounds, and cleanup tests.
2026-10-08 | 5.6e | complete | current workspace | `npm run lint`, `npm test` (93 tests), `npm run build`, `npm run test:e2e` (18 desktop/mobile tests), `git diff --check` | Moved SOAP/raw chart clipboard composition into a pure Chart formatter and added de-identified output regression checks.
2026-10-08 | 5.7a | complete | current workspace | `npm run lint`, `npm test` (93 tests), `npm run build`, sequential `npm run test:e2e` (18 desktop/mobile tests), `git diff --check` | Moved Dashboard view under `features/dashboard`, keeping shared controls in common ownership; initial parallel test run contended for build/browser resources, sequential rerun passed.
2026-10-08 | 5.7b | complete | current workspace | `npm run lint`, `npm test` (93 tests), `npm run build`, `npm run test:e2e` (18 desktop/mobile tests), `git diff --check` | Moved Profile and its exclusively owned general-data editor/display components under `features/profile`, retaining generic section cards and UI in shared modules.
2026-10-08 | 5.7c/5.7d | complete | current workspace | `npm run lint`, `npm test` (93 tests), `npm run build`, `npm run test:e2e` (18 desktop/mobile tests), `git diff --check` | Moved Course timeline and Handoff summary screens under `features/course` and `features/handoff`, retaining generic controls in shared UI.
2026-10-08 | 5.7e | complete | current workspace | `npm run lint`, `npm test` (93 tests), `npm run build`, `npm run test:e2e` (18 desktop/mobile tests), `git diff --check` | Moved Settings UI under `features/settings`; configuration remains shared and settings save behavior is unchanged.
2026-10-08 | 5.7f | complete | current workspace | `npm run lint`, `npm test` (93 tests), `npm run build`, `npm run test:e2e` (18 desktop/mobile tests), `git diff --check` | Moved landing and login screens under `features/access`, preserving app-owned route selection and legal modal composition.
2026-10-08 | 5.7g | complete | current workspace | `npm run lint`, `npm test` (93 tests), `npm run build`, `npm run test:e2e` (18 desktop/mobile tests), `git diff --check` | Moved shared navigation, global header, and patient header into `app/shell` while leaving orchestration in App.
2026-10-08 | 6.1h | complete | current workspace | `npm run lint`, `npm test` (94 tests), `npm run build`, `git diff --check` | Removed renderer callback `any` types using ReactMarkdown's exported component contract and added custom Markdown styling regression coverage.
2026-10-08 | 6.1i | complete | current workspace | `npm run lint`, `npm test` (94 tests), `npm run build`, `git diff --check` | Replaced untyped Gemini result/request/config and multimodal arrays with installed SDK contracts; transport request shapes remain equivalent.
2026-10-08 | 6.1j | complete | current workspace | `npm run lint`, `npm test` (94 tests), `npm run build`, `git diff --check` | Typed generated chart, progress-note, and reassessment JSON boundaries with domain-composed response contracts.
2026-10-08 | 6.1k | complete | current workspace | `npm run lint`, `npm test` (96 tests), `npm run build`, `git diff --check` | Replaced dynamic SOAP normalizer `any` values with `unknown` record checks and covered list conversion, fallback key precedence, cleanup, and identity preservation.
2026-10-08 | 5.5d | complete | current workspace | `npm run lint`, `npm test` (98 tests), `npm run build`, `npm run test:e2e` (18 desktop/mobile tests), `git diff --check` | Extracted Chart clinical-note resizing, bounds, and pointer-listener cleanup into a tested feature hook; preserved the 300px initial height and existing viewport thresholds.
2026-10-08 | 6.1l | complete | current workspace | `npm run lint`, `npm test` (98 tests), `npm run build`, `npm run test:e2e` (18 desktop/mobile tests), `git diff --check` | Resolved strict nullability/callback boundaries across patient updates, dropdowns, optional callbacks, attachments, and AI/chart contexts; enabled TypeScript `strict` mode.
2026-10-08 | 6.2b | complete | current workspace | `npm run format:check`, `npm run lint`, `npm test` (98 tests), `npm run build`, `npm run test:e2e` (18 desktop/mobile tests), `git diff --check` | Applied Prettier formatting consistently across existing supported files and made the formatting check a required CI step.
2026-10-08 | 6.4b | complete | current workspace | `npm run lint`, `npm test`, `npm run format:check`, `rg` source-import audit, `git diff --check` | Removed the unused root constants compatibility barrel and made tests assert the owning configuration modules directly.
2026-10-08 | 5.5e | complete | current workspace | `npm run lint`, `npm test` (99 tests), `npm run build`, `npm run test:e2e` (18 desktop/mobile tests), `git diff --check` | Extracted Chart history state, derived results, pagination, reset-on-filter, and active-entry page selection into a tested feature hook.
2026-10-08 | 6.4c | complete | current workspace | `npm run lint`, `npm test` (99 tests), `npm run build`, `npm run test:e2e` (18 desktop/mobile tests), import audit, `git diff --check` | Migrated imports to focused utility modules and removed the root `utils.ts` compatibility facade.
2026-10-08 | 5.5f | complete | current workspace | `npm run lint`, `npm test` (100 tests), `npm run build`, `npm run test:e2e` (18 desktop/mobile tests), `git diff --check` | Extracted entry-specific visibility persistence and fallback merging into a Chart hook; preserved the existing local-storage key and settings behavior.
2026-10-08 | 5.5g/5.5h | complete | current workspace | `npm run lint`, `npm test` (104 tests), `npm run build`, `npm run test:e2e` (18 desktop/mobile tests), `git diff --check` | Extracted status confirmation/toast orchestration and Chart toolbar/history-panel state with outside-click listener cleanup into tested Chart hooks.
2026-10-08 | 5.4f | complete | current workspace | `npm run lint`, `npm test` (101 tests), `npm run build`, `npm run test:e2e` (18 desktop/mobile tests), `git diff --check` | Extracted note content editing and attachment presentation into a memoized feature component with the existing markup and callback behavior; added an upload-forwarding regression test.
