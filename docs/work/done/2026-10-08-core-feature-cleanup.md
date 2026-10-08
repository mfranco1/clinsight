# Core feature cleanup

Status: done
Owner: Codex
Updated: 2026-10-08

## Goal

Streamline ClinSight by removing the About page, the home-instructions workflow, and clinical pearls from patient summaries, preserving core patient workflows and saved data.

## Scope

- Remove the existing About/landing page and its navigation wiring.
- Remove home-instructions UI, printing, and its dedicated AI operation.
- Remove clinical pearls from summary presentation, clipboard output, and future AI generation.
- Update affected tests and authoritative documentation.

## Non-goals

- A replacement landing page or redesigned login flow.
- Changes to patient discharge status, prescriptions, SOAP plan education/management content, or other clinical workflows.
- Deleting saved clinical content, changing stable IDs, or introducing backend infrastructure.
- Broader dependency, architecture, or visual redesign work.

## Implementation plan

### 1. Remove About completely

- Delete `src/features/access/LandingPage.tsx`.
- Remove its type import, lazy-feature registration, `ViewMode.ABOUT` branch, and footer navigation from `src/App.tsx`.
- Remove `ABOUT` from `ViewMode` in `src/types.ts` and the obsolete `onGoToAbout` prop/destructuring from `src/features/access/LoginPage.tsx` and its caller.
- Keep the existing dashboard startup, login/logout behavior, and Privacy/Terms dialogs. Remove only page-specific assets or helpers confirmed to have no remaining consumers.
- Verify startup and login/logout navigation on desktop and mobile, and confirm the About entry is absent.

### 2. Remove home instructions completely

- Remove the Home Instructions button and `onOpenInstructions` prop from `src/features/chart/components/PlanSection.tsx`.
- Remove modal import, open state, callback, and render wiring from `src/features/chart/SoapView.tsx`.
- Delete `HomeInstructionsModal.tsx`, `homeInstructionsPrint.ts`, and the feature-only `tests/home-instructions-print.test.ts`.
- Remove `generateHomeInstructions` from AI actions, the gateway interface, gateway implementation, and related test mocks/assertions.
- Remove `HomeInstructions`, its generator/schema, and `HOME_INSTRUCTIONS_PROMPT` from the task/prompt modules. Remove imports made unused by these deletions.
- Preserve `parsePrescriptions` and its contracts/tests: it shares `src/services/ai/tasks/discharge.ts` with home instructions. Keep that module for prescription parsing; no rename is necessary for this cleanup.
- Confirm no active feature references remain. The modal uses transient component state, so no patient-storage migration is expected.
- Verify chart plan editing and Generate Rx/print remain usable, and patient discharge/reactivation still work.

### 3. Remove clinical pearls from patient summaries

- Remove the Clinical Pearl card and clipboard section from `src/features/handoff/SummaryView.tsx`; remove imports made unused by this change.
- Remove the clinical-pearl instruction from `REFRESH_SUMMARY_SYSTEM_INSTRUCTION` and the property from both chart-generation and summary-refresh response schemas. Remove the unused `handoff_clinicalPearl` schema description.
- Retain `HandoffSummary.clinicalPearl?: string` as a documented legacy compatibility field. Existing records must still hydrate, import, and export without silently dropping it; the UI and copied summary omit it.
- Check summary refresh/update mapping for legacy-field retention. When replacing a summary, preserve an existing legacy pearl rather than erasing it incidentally. Exclude that legacy field from the refresh prompt context so future generation focuses on the current summary fields.
- Add focused synthetic tests for hidden pearls and clipboard omission, both AI schemas/prompts, and legacy record hydration/import-export plus summary edits/refresh. Preserve summary, active issues, action items, IDs, and source context.

### 4. Document, verify, and close

- Update `docs/product.md` to describe login-only access and the narrowed chart/summary features. Update `docs/ai-integration.md` for the removed operation and pearl-free generation, and `docs/data-and-persistence.md` for the retained legacy field.
- Leave completed work records as historical evidence; update current guidance rather than rewriting past outcomes.
- Run the checks below, inspect affected desktop/mobile views, and resolve relevant failures before claiming completion.
- Update this tracker with actual verification and outcome, then move the same file to `docs/work/done/`.

## Acceptance criteria

- [x] No About page, view mode, lazy import, or navigation entry remains.
- [x] No home-instructions button, modal, print helper, or AI operation remains.
- [x] Patient summaries and copied summaries omit clinical pearls; new chart and refresh requests no longer request them.
- [x] Legacy pearls survive saved-data round trips and ordinary summary updates without becoming visible.
- [x] Login/logout, chart editing, prescriptions/printing, patient status, summary editing/refresh/copy, and Privacy/Terms remain functional.
- [x] Relevant tests and required checks pass; current documentation reflects the narrowed feature set.

## Progress

- Inspected the working tree, implementation, relevant tests, and product/AI/persistence/testing guidance. Working tree was clean before this plan was added.
- Removed the About page and its navigation/type wiring.
- Removed home-instructions UI, print helper, and AI action while retaining prescription parsing.
- Removed pearls from summary display/copy and AI instructions/schemas. Legacy saved values remain typed, survive persistence, and are carried through handoff updates.
- Updated product, AI, and persistence documentation. Refreshed the Chromium dashboard snapshot after removing the footer link.

## Decisions

- Remove feature code rather than hiding features behind flags. Future landing/home-instructions work can be scoped separately.
- Retain legacy clinical-pearl data for compatibility; removal from the product does not authorize deleting saved clinical material.
- Preserve prescription parsing despite its shared task module name, and retain clinical education within SOAP plans.

## Verification

- `npm run typecheck`, `npm run lint`, `npm test` (150 passed), `npm run build`, `npm run check:dead-code`, `npm run docs:check`, and `npm run format:check` passed.
- Focused regression tests passed (19 tests across summary presentation, AI contracts, transitions, and persistence).
- `npm run test:e2e` passed 31 tests across Chromium and mobile; one existing bootstrap test was skipped. The first run identified the expected About-link snapshot difference; the dashboard snapshot was refreshed and the complete rerun passed.
- Use offline synthetic AI responses only. These checks do not establish live provider behavior or clinical correctness.

## Outcome

Removed the requested features, preserved legacy records and adjacent core workflows, updated documentation, and passed the recorded checks.
