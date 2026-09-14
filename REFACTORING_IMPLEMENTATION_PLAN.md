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

##### [-] 1.2b2 Type chart-history and persistence adapters

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

#### [-] 1.3b Extract date and text utilities

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

### [ ] 2.1 Extract patient record hydration and migration

**Scope:** Move the local-storage loading/migration logic from `App.tsx` into a versioned `patientRepository` or `patientPersistence` module. Preserve the current storage key and legacy encounter migration.

**Verification:** All Phase 0 fixtures hydrate to equivalent patient records; malformed storage falls back safely without crashing the app.

### [ ] 2.2 Define pure patient transition functions

**Scope:** Extract pure operations for patient creation/import, entry updates/deletion, encounter/status transitions, course events, handoff, orders, medications, and notes.

**Verification:** Unit tests prove each operation is immutable, preserves unrelated patient data, and matches current state transitions.

### [ ] 2.3 Create the patient store/provider

**Scope:** Introduce a small reducer/context facade over the transition functions. It may coexist with `App` state during migration; do not add a third-party state library.

**Verification:** Dashboard selection, patient navigation, persistence, and updates work unchanged through the facade.

### [ ] 2.4 Migrate `App.tsx` patient handlers to the store

**Scope:** Replace duplicated `setPatients` map/filter handlers with store actions. Preserve the existing props passed to views and leave view rendering unchanged.

**Verification:** Existing workflow and visual tests pass; `App.tsx` no longer contains patient-record mutation logic.

### [ ] 2.5 Normalize import/export and attachment persistence

**Scope:** Make import normalization immutable, introduce a serializable attachment representation, and rebuild transient preview URLs after hydration.

**Verification:** Export/import round trips preserve visible data; image/PDF attachments open and preview correctly after reload; blob URLs are released only when their attachment is no longer used.

## Phase 3 — AI gateway and clinical task modules

### [ ] 3.1 Define the clinical AI gateway contract

**Scope:** Create typed task interfaces for chart generation, progress notes, reassessment, chat, transcription, lookup, suggestions, photo analysis, home instructions, and prescription parsing.

**Verification:** The UI remains on the existing direct Gemini implementation through an adapter; no feature behavior changes.

### [ ] 3.2 Extract Gemini transport and file conversion

**Scope:** Separate SDK client construction, abort handling, response sanitation, grounding-source extraction, and file/blob conversion from task-level prompts.

**Verification:** Unit tests cover cancellation, malformed structured output, grounding-source normalization, and file part conversion.

### [ ] 3.3 Extract schemas, prompts, and task adapters

**Scope:** Move each clinical task from the monolithic service into focused modules with typed input/output parsing. Preserve prompt text, model defaults, and schemas exactly in this slice.

**Verification:** Fixture-backed contract tests compare the adapter request shape and parsed result shape with the pre-extraction behavior.

### [ ] 3.4 Introduce feature-level AI hooks/actions

**Scope:** Replace direct `geminiService` imports in one feature at a time with feature hooks/actions that call the gateway.

**Verification:** Each migrated feature retains its loading, cancellation, error, and notification behavior. No component imports the Gemini SDK.

### [ ] 3.5 Remove sensitive production logging

**Scope:** Route diagnostics through a redacting logger and ensure patient prompts, records, API responses, and credentials are not logged in production.

**Verification:** Development diagnostics remain useful; production logging contains no clinical payloads.

### [ ] 3.6 Implement the server-side AI proxy (only after DG-1)

**Scope:** Move credential-bearing Gemini calls behind a server endpoint while retaining the `ClinicalAiGateway` contract.

**Verification:** The UI contract and AI task result shapes remain unchanged; no API key is bundled into browser output.

## Phase 4 — Reusable interaction primitives

### [ ] 4.1 Standardize modal and confirmation composition

**Scope:** Strengthen `ModalShell` and `ConfirmationModal` into the shared primitive for common overlays. Migrate one low-risk modal at a time without altering its markup/classes beyond the shell boundary.

**Verification:** Escape/backdrop behavior, focus handling, z-index, animation, and mobile layout match the visual baseline for each migrated modal.

### [ ] 4.2 Create a reusable portal/popover primitive

**Scope:** Extract viewport-aware portal positioning, outside-click dismissal, resize/scroll tracking, and accessibility wiring from the duplicated dropdown implementations.

**Verification:** `OrderStatusDropdown` and `MedicationStatusDropdown` render identically at desktop and mobile widths, including edge-of-screen placement.

### [ ] 4.3 Create reusable media hooks

**Scope:** Extract `useAudioRecorder` and `useCameraCapture`, including stream cleanup, permission errors, and transcription handoff.

**Verification:** Input, Chat, Smart Append, and both Notes recording paths produce the same transcript/user feedback and release media tracks on close/unmount.

### [ ] 4.4 Create reusable attachment hooks and display primitives

**Scope:** Consolidate file conversion, drag/drop state, previews, removal, and opening behavior around the existing file components.

**Verification:** Input, Chat, Notes, and Photo Gallery preserve their existing accepted file types, previews, and attachment interactions.

### [ ] 4.5 Consolidate status-selection behavior

**Scope:** Back the order and medication status controls with a generic typed status-select primitive while preserving their separate labels and colors.

**Verification:** Every status option, color, callback payload, and keyboard/click interaction remains unchanged.

## Phase 5 — Feature-by-feature migration

### [ ] 5.1 Orders feature pilot

**Scope:** Move Orders, order cards, medication rows, bulk order entry, and prescription flows into `features/orders`. Reuse the existing `domain/orders.ts` as the model layer.

**Verification:** Filtering, sorting, grouping, drag-and-drop, selection, medication changes, bulk entry, and prescription print output match the baseline.

### [ ] 5.2 Patient input feature

**Scope:** Move Input Section, drafts, templates, import, lookup launching, and input attachments into `features/input` using the shared media/attachment primitives.

**Verification:** New-chart, append-entry, manual-save, drafts, templates, import, reset, lookup, and dictation paths behave identically.

### [ ] 5.3 Chat feature

**Scope:** Move the clinical assistant panel and its resize, message, retry, save-to-note, attachment, search, and recording behavior into `features/chat`.

**Verification:** Conversation context, cancellation, retry behavior, resizing, and saved notes match the baseline.

### [ ] 5.4 Notes feature

**Scope:** Split Notes list/card/thread behavior into focused components and remove duplicate thread/floating recorder and message-send logic using shared hooks.

**Verification:** Editing, attachments, text selection, thread/floating follow-ups, subnote operations, collapse state, and search highlighting match the baseline.

### [ ] 5.5 Chart/SOAP feature — state and history first

**Scope:** Extract history navigation/filtering, entry visibility preferences, note resizing, chart toolbar state, and status actions from `SoapView` into feature-local hooks/components.

**Verification:** History filtering, pagination, encounter grouping, collapsed state, entry selection, and chart navigation match the baseline.

### [ ] 5.6 Chart/SOAP feature — clinical sections and actions

**Scope:** Extract photo analysis, clinical-data integration, references, prescriptions, instructions, and each SOAP section into composable feature parts.

**Verification:** Structured/raw rendering, editing, visibility controls, photo categories, AI actions, copied output, references, and all chart modals remain visually and functionally equivalent.

### [ ] 5.7 Remaining view features

**Scope:** Move Dashboard, Profile, Course, Handoff, Settings, landing/login, and shared shell/navigation into their respective feature/app modules.

**Verification:** Navigation, active-patient resets, notification permission, mobile-header behavior, legal modals, and responsive layout match the baseline.

## Phase 6 — Final hardening and cleanup

### [ ] 6.1 Enable stricter TypeScript incrementally

**Scope:** Enable `strict` and related safe compiler options only after affected code is typed. Do not suppress failures globally.

**Verification:** Type checking passes with no new broad casts or `@ts-ignore` comments.

### [ ] 6.2 Add linting, formatting, and CI gates

**Scope:** After DG-2, configure ESLint, Prettier, test scripts, and CI to require type-checking, linting, tests, and production build.

**Verification:** A clean checkout can run all quality gates with documented commands.

### [x] 6.3 Resolve the CSS build warning safely

**Scope:** Remove or provide the missing `/index.css` reference only after confirming it has no runtime styling responsibility. Keep Tailwind delivery unchanged unless DG-3 approves its migration.

**Verification:** Production build has no missing-CSS warning. The compiled Tailwind stylesheet contains the existing utility classes and custom animations; visual snapshot comparison remains tracked in 0.3.

### [ ] 6.4 Remove compatibility facades and dead code

**Scope:** Remove transitional exports, unused legacy helpers, duplicate implementations, and obsolete comments after all importers are migrated.

**Verification:** Repository search confirms no old service paths or dead compatibility imports remain; full test and visual suite passes.

### [ ] 6.5 Refresh documentation and close the refactor

**Scope:** Update README with architecture, feature ownership, commands, test strategy, persistence compatibility, and AI gateway deployment notes.

**Verification:** A new contributor can run, test, and understand the application boundaries from repository documentation.

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
