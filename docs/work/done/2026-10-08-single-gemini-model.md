# Remove model selection and use Gemini 3.8 Flash

Status: done
Owner: Codex
Updated: 2026-10-08

## Goal

Remove model selection completely and route every AI operation through `gemini-3.8-flash`, preserving all existing prompts, response schemas, and clinical result contracts.

## Scope

- Remove model controls from intake, chat, and settings, including model-specific pending labels.
- Remove model state, preference access, props, hook inputs, action arguments, gateway request fields, and task arguments used for model selection.
- Enforce the fixed provider model in the Gemini transport, including operations that currently omit an explicit model.
- Update relevant tests and authoritative AI/product documentation.

## Non-goals

- No edits to prompt text, prompt builders, system instructions, response schemas (including inline schemas), clinical data schemas, or persisted patient record shapes.
- No provider, backend, credential, SDK dependency, or deployment changes.
- No changes to parsing, grounding, attachment conversion, cancellation, task error fallbacks, or clinician review workflows.
- Internal model-selection fields may be removed from AI invocation interfaces; these are not changes to clinical or provider output schemas. Preserve conversation messages whose role is `model`.

## Acceptance criteria

- [x] Every provider request uses exactly `gemini-3.8-flash`; there is no configurable model override or alternate-model routing.
- [x] Intake, chat, and settings expose no model selector; their remaining controls work on desktop and mobile.
- [x] Legacy `clinsight_default_model` values cannot influence requests; patient data and other preferences remain compatible.
- [x] All existing prompt builders, system instructions, and response schemas remain unchanged.
- [x] Updated AI, hook, UI, and browser tests pass without calling an AI provider.
- [x] Typecheck, lint, build, documentation, and formatting checks pass.

## Implementation plan

1. **Centralize fixed routing.** Replace `MODELS`, `DEFAULT_MODEL`, and `DEFAULT_STRUCTURED_MODEL` with a single provider-owned constant in the AI service layer. Remove `GeminiRequest.model` and set the SDK request model directly at the transport boundary. Delete capability-based alternate-model fallback and the obsolete Gemini 3.5 conditional thinking configuration. Keep current request contents, system instructions, MIME types, schemas, search tools, and response handling intact; do not add new thinking settings.
2. **Remove model plumbing.** Update `clinicalAiGateway.ts`, `geminiGateway.ts`, `actions.ts`, and all task signatures/call sites together. Cover chart generation, progress notes, reassessment, summary refresh, conversations, transcription, photo analysis, suggestions, integration, lookup, response titles, and prescription parsing. Preserve lazy task loading, abort checks, argument ordering for remaining inputs, and typed clinical results.
3. **Remove selection and preference state.** Delete `model`/`defaultModel` state, resets, and preference effects in `App.tsx`. Remove selectors and related props in `InputSection`, `ChatPanel`, and `SettingsView`; remove model plumbing in `SoapView`, `useChartPhotoAnalysis`, `useChatConversation`, and any remaining callers. Use the existing pending label without a model name. Stop reading/writing `clinsight_default_model`; leave any legacy key inert rather than introducing a storage migration. Retain specialization and other settings behavior.
4. **Update regression coverage.** Adjust `ai-actions.test.ts`, `ai-task-contracts.test.ts`, `use-chat-conversation.test.tsx`, `use-chart-photo-analysis.test.tsx`, and affected note-thread/caller tests to the simplified signatures. Continue asserting clinical inputs, attachments, search flags, cancellation, schemas, response shapes, malformed responses, and task fallbacks. Add focused UI/browser assertions for absent selectors and unaffected settings/intake/chat behavior, including reload with a stale saved model preference.
5. **Prove transport routing and invariants.** The current transport suite deliberately rejects provider calls in test mode. Preserve that guard and network prohibition. Extract a small pure SDK request builder used by transport so tests can assert the fixed model for plain text, structured output, grounded requests, and media without enabling provider calls. Compare representative task requests before/after after excluding only model selection; assert exact contents/system instructions and deep-equal schemas rather than weakening existing expectations. Review the diff to verify prompt/schema files and inline schemas are unchanged.
6. **Document and validate.** Update `docs/ai-integration.md` with the single-model policy and inert legacy preference; update `docs/product.md` with removal of model selection. Run the checks below, record actual results, and move this same tracker to `done/` only after implementation and acceptance criteria are complete.

## Progress

- Inspected the clean working tree, selection UI, stored preference paths, gateway/actions/tasks, transport, and existing tests.
- Model choice currently spans intake, chat, settings, app state, hooks, and AI invocation interfaces. Note-thread calls additionally resolve saved model preferences in actions and tasks; changing only the default constant would not satisfy the goal.
- Prescription parsing and some helper operations rely on the transport default, so enforcing the model at the final request boundary is required.
- The transport pins requests to `gemini-3.8-flash`; model arguments and saved preference reads have been removed from task, gateway, action, app, and feature call paths.
- Model controls have been removed from intake, chat, and settings. Specialization, chat cancellation, attachments, and clinical task inputs remain in their workflows.
- Regression expectations have been updated for action, task, chat-hook, photo-analysis, note-thread, and browser UI contracts. Browser checks cover removed selectors and a stale saved preference; a transport request-builder test covers text, structured, grounded, and media requests without enabling network calls.
- Prompt and schema files are absent from the diff. Typecheck, lint, production build, documentation checks, formatting, and diff whitespace checks have passed. All 155 unit tests and six targeted browser checks passed.

## Decisions

- Use the exact stable API identifier `gemini-3.8-flash`. Google's [model reference](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash) documents structured output, search grounding, and text/image/audio/PDF input support (checked 2026-10-08). This is documentation verification, not a live provider test.
- Remove selection throughout the call chain instead of merely hiding controls or updating defaults.
- Preserve all prompts and schemas, including those declared inside task modules that otherwise need signature edits.

## Verification

- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `npm run docs:check` passed.
- `npm run format:check` passed.
- `git diff --check` passed.
- `npm test` passed: 53 files, 155 tests.
- `npm run test:e2e -- tests/e2e/input-workflow.spec.ts tests/e2e/chat-workflow.spec.ts` passed: six desktop/mobile checks.
- Tests must never call an AI provider. Passing checks will not establish live provider availability or clinical output correctness.

## Outcome

Model selection was removed throughout the app and AI call chain, and provider traffic is fixed to Gemini 3.8 Flash. Prompts and schemas remain unchanged. All acceptance criteria and verification checks are complete.
