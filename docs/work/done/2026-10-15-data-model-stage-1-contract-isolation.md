# Data model stage 1: contract baseline and isolation

Status: done
Owner: Codex
Updated: 2026-10-15

Parent: [Data model roadmap](../ongoing/2026-10-14-data-model-postgresql-fhir-plan.md)
Next stage: [Validated, versioned persistence](../ongoing/2026-10-15-data-model-stage-2-versioned-persistence.md)

## Goal

Establish tested compatibility boundaries for AI and durable attachments before changing the persisted patient model. This tracker owns W01–W03 and their execution evidence. Implementation authorized on 2026-10-15; execute W01 before changing runtime contracts.

## Scope

- Characterize current AI, storage and import contracts and measure synthetic persistence costs.
- Isolate explicit AI task DTOs and projections without changing provider behavior.
- Distinguish durable attachment data from runtime files while preserving serialized output.

## Non-goals

Storage format changes, stricter import policy, clinical workflow redesign, PostgreSQL, FHIR adapters and production security infrastructure belong to later stages. No new UI layout is planned; existing accessibility, review/edit and identity-switch behavior must remain intact.

## Readiness and dependencies

W01–W03 completed in dependency order after authorization. W01 recorded the pre-refactor baseline without runtime fixes; W02/W03 preserved those contracts. Stage 2 W04 now has its prerequisites. No D1–D6 gate was needed for this stage.

## Package state

- W01: complete; owner Codex; baseline evidence and accepted-shape inventory below.
- W02: complete; owner Codex; all-operation provider equivalence and shared checks pass.
- W03: complete; owner Codex; durable types, nested byte round trips and browser cleanup checks pass.

## Shared constraints and source documents

Inherit requirement IDs R1–R7, outcome IDs AC1–AC8, clinical invariants and decision gates from the parent. Package references to ACs indicate contribution to those outcomes, not completion of the entire roadmap. Stage acceptance below is the closure checklist; do not duplicate it in the parent.

Read [architecture](../../architecture.md), [data and persistence](../../data-and-persistence.md), [AI integration](../../ai-integration.md) and [testing](../../testing.md) before implementation. Reinspect the working tree and applicable AGENTS.md files; named new modules are proposed locations, not existing files. Preserve unrelated work and use synthetic offline fixtures only.

## Work packages

### W01 — Freeze existing behavior and establish baselines

Readiness: ready. Requirements: R1–R3, R5. Acceptance: baseline evidence for AC1–AC3, AC5–AC6.

- Inspect `src/types.ts`, `src/services/ai/clinicalAiGateway.ts`, `actions.ts`, `geminiGateway.ts`, all seven task modules, `patientPersistence.ts`, `attachmentPersistence.ts`, `src/features/input/importCases.ts`, `src/hooks/usePatientStore.ts` and the App import/export/write call sites.
- Extend existing synthetic fixtures under `tests/fixtures/`; cover structured/raw entries, string/record ROS and exam values, optional collections, prefixed/legacy IDs, missing encounter links, subnotes, legacy pearls and attachments at every supported nesting location.
- Characterize every gateway operation: request defaults, context selection/order, provider schema, parsed output, empty/malformed fallback, cancellation where supported. Fix time/ID sources in tests; compare relevant request values rather than snapshotting implementation internals.
- Record the accepted shapes separately for startup storage, one case file, multiple selected files and internal import handlers. The current file parser accepts one chart object per file; handler array support is not proof of array-in-one-file support. Do not expand the file format here.
- Add negative characterization for duplicate patient IDs, malformed nested records and corrupt attachments. Document unsafe current behavior explicitly; do not encode it as the desired future acceptance rule or fix it in this package.
- Benchmark synthetic cohorts of 10 and 100 patients with 20 entries each, plus a separate 10-patient attachment workload. Record source sizes, attachment sizes, browser/machine, warmup, sample count, median/p95 hydration/serialization time and bytes written for one edit. Do not attempt over-quota writes to the user's actual storage. Treat memory figures as optional if the runtime cannot measure them reliably.
- Exit: test-backed contract inventory and measured baseline recorded in this tracker. No application behavior changes. Existing gaps distinguish current behavior from target ACs.

### W02 — Decouple AI DTOs and projections

Readiness: ready after W01. Requirements: R1. Acceptance: AC1, AC5.

- Add proposed `src/services/ai/contracts.ts` for explicit task inputs/results and only the nested types those tasks consume. Avoid `Pick`/`Omit` references to mutable domain aggregates for the frozen boundary. Preserve optionality and legacy value unions.
- Add proposed `src/services/ai/contextAdapters.ts` for domain-to-task projections when required by an actual caller. Keep feature-facing actions compatible; update the gateway and task signatures to use the independent contracts.
- Cover chart generation, progress notes, reassessment, chat, note threads, summary refresh, clinical/input assistance, prescription parsing, lookup, media analysis, transcription and title generation. Preserve the existing result-to-workflow path; do not add clinical interpretation.
- Preserve provider schemas, prompts, history truncation, chronological order, defaults, abort signals and lazy task loading. Media remains an explicit runtime input; task contracts need not be JSON-only.
- Prove that adding a synthetic future domain field does not change provider context. Do not filter out existing task-consumed data while doing so. Verify no patient switch/cancellation regression using existing request identity and async-action tests.
- Exit: no gateway signature depends on `MedicalChartResponse`; equivalence tests pass for each operation. Update `docs/ai-integration.md` and ownership guidance only to describe implemented boundaries.

### W03 — Make durable attachment types truthful

Readiness: ready after W01; integrate with W02 before W04. Requirements: R2–R3. Acceptance: AC2, AC5.

- Define explicit persisted attachment metadata/content types in `src/services/attachmentPersistence.ts` or a nearby persistence-contract module if shared by the next package.
- Replace misleading generic promises that serialized `T` remains the same runtime `T` at patient persistence/export boundaries. Serialized values contain metadata, not `File`; preview URLs remain runtime-only.
- Preserve current durable key names, bytes, category, MIME type, filename and modification time. Do not add storage envelopes or new attachment IDs yet.
- Extend `tests/attachment-persistence.test.ts` for nested entry/note/subnote attachments and byte equality. Characterize hydration failure here; stricter rejection belongs to W04. Verify preview URLs are revoked on failed partial hydration and owner removal when changing allocation paths.
- Exit: explicit durable/runtime conversions with unchanged persisted output. Update `docs/data-and-persistence.md` for the implemented boundary.

## Acceptance criteria

- [x] S1-AC1 (W01; R1–R3): every gateway operation and each actual storage/import entry point has a test-backed contract inventory; unsafe current behavior is recorded as a gap, not a future guarantee.
- [x] S1-AC2 (W01; R5): reproducible synthetic benchmark setup, dataset sizes, sample method and hydration/serialization/write-volume baseline are recorded here without touching user patient storage.
- [x] S1-AC3 (W02; R1): gateway inputs/results no longer depend on the patient aggregate, all characterized provider payload/schema/result behavior remains equivalent, and unrelated future domain fields cannot leak into AI context.
- [x] S1-AC4 (W03; R2): durable attachment types accurately describe serialized values; supported nested attachments preserve bytes and metadata without persisted runtime Files or blob URLs.
- [x] S1-AC5 (W02–W03; R1–R3): cancellation, patient switching, legacy source text, references and existing resource cleanup remain covered and passing; storage/export shapes remain unchanged.
- [x] S1-AC6: relevant checks pass, implemented contract ownership is reflected in authoritative docs, and the stage 2 handoff contains the accepted-shape inventory, known gaps and baseline measurements.

## Verification plan

At package completion, run applicable focused tests and the shared-contract suite. Record actual results, not just this command list:

```sh
npm test -- tests/ai-actions.test.ts tests/ai-task-contracts.test.ts tests/response-parsing.test.ts tests/gemini-transport.test.ts
npm test -- tests/patient-persistence.test.ts tests/attachment-persistence.test.ts tests/input-import.test.ts tests/patient-factories.test.ts tests/patient-transitions.test.ts
npm test -- tests/request-identity.test.ts tests/app-async-actions.test.tsx
npm run typecheck
npm test
npm run build
npm run docs:check
npm run format:check
```

Run focused groups while iterating; repeat broad checks only after relevant changes. A build does not establish live AI behavior, clinical accuracy, FHIR conformance or production readiness.

For changed runtime attachment or persistence plumbing, also run:

```sh
npm run test:e2e -- tests/e2e/persistence.spec.ts tests/e2e/input-workflow.spec.ts tests/e2e/patient-navigation.spec.ts
```

When AI action plumbing changes, run `npm run test:e2e -- tests/e2e/chat-workflow.spec.ts`. Retain offline provider stubs. Compare serialized clinical content and attachment bytes directly; do not rely only on typechecking.

## Risks and recovery

Accidental task-context changes and dishonest serializer typing are the main risks. Keep provider schemas/prompts and durable formats frozen, compare against W01 fixtures, and revert the affected code change if equivalence fails. No data-format rollback should be needed because this stage must not introduce a new writer. Newly discovered behavior defects should be recorded for a scoped follow-up instead of hidden in the refactor.

## Documentation impact

Update `docs/ai-integration.md`, `docs/data-and-persistence.md` and, if module ownership changes, `docs/architecture.md` alongside the relevant implementation. Planning alone changes none of their current implementation facts.

## Progress

W01 baseline was recorded before runtime edits. W02 independent contracts/projections and W03 durable attachment typing are complete; required checks pass. Working tree started clean; no commit or PR created. This tracker moved to `done/`; stage 2 contains a linked handoff. Exact next action: separately authorize/claim W04 and choose the shared validator using the accepted shapes, gaps and baseline below.

## Handoff and closure

Update each package's owner/status and record affected paths, commit/PR if present, acceptance evidence, actual commands/results, failures, compatibility limits and exact next action. Keep detailed evidence here; the parent owns only shared scope, dependencies and gates. Move this same stage file to `done/` after its acceptance criteria pass, repair incoming links in the parent and sibling stage, and hand off the required evidence. Do not mark deferred packages complete or close the parent solely because this stage is complete.

## Verification

- W01: 25 new baseline cases and 38 existing focused cases passed before runtime edits. `node scripts/benchmark-persistence.mjs` completed the isolated synthetic Chromium baseline below.
- Shared contract group: 14 focused files / 67 cases passed after the initial W02/W03 edits. All-operation request/schema/result equivalence, pending-import cancellation and four actual App import-handler cases are included in the final suite.
- `npm test -- --maxWorkers=2`: **84 files / 270 tests passed**. The initial unrestricted full run was interrupted after unrelated UI timing failures under resource contention; the two-worker full runs passed without changing those tests or their timeouts.
- `npm run lint`: passed, including `npm run typecheck`. Typecheck also passed independently during iteration.
- `npm run build` and `npm run check:bundle-size`: passed; largest chunk 448.45 kB (500 kB limit), startup 199.93 kB gzip. AI tasks/transport remain lazy chunks.
- `npm run test:e2e -- tests/e2e/persistence.spec.ts tests/e2e/input-workflow.spec.ts tests/e2e/patient-navigation.spec.ts tests/e2e/chat-workflow.spec.ts`: **39 passed, 1 expected skip** across desktop/mobile. The skip is the narrow-screen-only toolbar case on desktop. This covers import/export, reload, preview deletion cleanup, patient navigation, drafts and chat panel interaction. Provider requests/results use offline unit mocks; no live AI validation is claimed.
- `npm run docs:check`, `npm run format:check` and `git diff --check`: passed, including final tracker relocation/link checks.

## Outcome

Stage 1 complete. Explicit AI contracts/projections and truthful durable attachment types are implemented with equivalent existing provider and storage behavior. Clinical source text, references, IDs, optional/legacy fields and attachment bytes remain preserved. Known unsafe import/hydration/collision behavior is documented for W04 rather than fixed in this refactor. Stage 2 remains unstarted; no storage envelope, backend, FHIR adapter or clinical workflow change was introduced.

## W01 contract inventory and exit evidence

W01 baseline tests pass before runtime edits: 25 new cases in `tests/ai-gateway-baseline.test.ts` and `tests/persistence-contract-baseline.test.ts`, plus 38 existing cases across the 11 focused files listed in the verification plan. Fixtures in `tests/fixtures/patient-cases.ts` cover raw/structured entries, legacy string and record ROS/exam, optional collections, legacy/prefixed IDs, missing links, source formatting, references, pearls and all attachment owners.

### Accepted shapes and known gaps

- Startup `loadPersistedPatientsWithStatus`: absent/empty string and `[]` succeed empty; JSON must be an array of shallow chart records (`id` string, `patientInfo` object, `entries` array). Any shallow-invalid member rejects the collection with `error: true`; the direct migration helper instead filters invalid top-level members. Missing encounters are created; missing entry/course/order encounter links use the first encounter. Medication links are not inferred. Repeat migration retains established IDs.
- `parsePatientCaseFile`: one object per file, with truthy `entries`, `course`, `handoff`. A JSON array in one file is rejected. Nested types, patient identity and relationship validity are unchecked. `parsePatientCaseFiles` uses ordered `Promise.all`; multiple selected files produce a batch, and one parser failure rejects that batch before the handler runs.
- App internal import handler: accepts a chart or chart array; empty batch is ignored, singleton opens chart, larger batch prepends to the store and opens dashboard. Hydrates attachments, generates only missing chart IDs (the legacy handoff patientId content is untouched), preserves existing IDs and does **not** apply startup encounter migration. This is not additional file-format support. Existing `tests/e2e/persistence.spec.ts` covers actual import/export paths; `tests/app-import-contracts.test.tsx` invokes the actual App handler for object/singleton/batch/empty inputs, and store/hydration behavior is also characterized directly.
- App storage writer serializes the entire patient array after an edit; export serializes one patient with two-space indentation. No envelope/version. Preview URLs are removed; attachment file metadata, base64, MIME and category remain. Runtime files/previews are rebuilt during hydration.
- Unsafe gaps for W04: duplicate patient IDs survive startup/import, and store update/delete affects every matching ID; malformed nested entries can fail startup after shallow acceptance but pass the file parser; even missing handoff/course may pass startup; corrupt base64 falls back to metadata rather than a runtime File without a reported error. Successful sibling attachment previews remain owned by the accepted patient. These observations are characterization, not desired future rules.

### AI operation inventory

The gateway baseline exercises all 16 operations offline through mocked transport. Existing task/transport tests additionally cover grounding, dynamic ROS/exam postprocessing, fixed model routing and in-flight abort rejection.

- Chart: default General Practice/search false, face-sheet JSON, first five history entries in incoming order, optional file parts; required schema patientInfo/soap/course/handoff; local ID, references/grounding default arrays. Empty/malformed JSON rejects.
- Progress: fixed reference date/time, first three entries reversed for chronological history; required soap/courseEvent, optional inferredDate/inferredTime; reference/grounding defaults. Empty/malformed JSON rejects.
- Reassessment: SOAP/history/specialization context, search false default; assessment/plan required with broaderManagement and references available. Malformed/empty JSON rejects; grounding retained.
- Chat: full chart JSON, ordered role/text history, runtime file parts, search false default and AbortSignal; extracts note_title or defaults title to Clinical Conversation. Empty text remains empty. Thread: full chart plus note title/content/highlight, search true, ordered history/files and signal; empty response remains empty. Both reject pre-aborted calls before transport.
- Summary: face sheet, four summary fields (legacy pearl excluded), recent entry date/type/soap/rawText and full recent course; required patientId/oneLiner/activeIssues/toDoList. Empty/malformed JSON rejects.
- Clinical suggestions: Subjective/Objective prompts with ARRAY schema; malformed text falls back to Markdown bullets, empty to empty array. Integration: text prompt, empty output retains current content.
- Input suggestions: questions/tests arrays, each text/rationale; empty/malformed JSON rejects. Lookup: grounded search true and signal, returns transport text/grounding; pre-aborted calls reject.
- Photo analysis: clinical exam text fallback; lab schema labs/labInterpretation, imaging schema imaging/imagingCorrelation, malformed/empty JSON rejects. All convert runtime files to provider parts.
- Transcription: Blob MIME/base64 plus transcription instruction; returns text including empty. Title: response truncated at 1000 characters, trims surrounding quote/asterisk markers, provider error falls back to Clinical Conversation (empty text stays empty).
- Prescriptions: plan JSON, seven required string fields; empty/malformed/provider errors return empty array. JSON parsing generally does not validate runtime result shapes; W01 does not add provider validation.

### Synthetic browser persistence baseline

Reproduce with `node scripts/benchmark-persistence.mjs`. Measured 2026-10-15 on Darwin 27.0.0 arm64, Apple M1, 8 logical CPUs, 8 GiB RAM; headless Playwright Chromium 156.0.8078.4. Fresh isolated blank browser context, all network blocked, no localStorage access or writes. Five warmups then 30 samples per dataset; nearest-rank p95 and upper-middle median, milliseconds. Hydration includes JSON parse, migration and File creation; serialization includes one title edit, recursive attachment conversion and JSON.stringify. Write volume is the actual resulting whole-array JSON size; storage I/O latency is not measured. Runtime memory not measured reliably.

- 10 patients × 20 entries: 345,291 UTF-8 source bytes (690,582 UTF-16 bytes); hydration median/p95 1.3/2.0 ms; serialization 1.0/1.8 ms; one-edit write volume 345,298 UTF-8 bytes.
- 100 patients × 20 entries: 3,454,881 UTF-8 source bytes (6,909,762 UTF-16 bytes); hydration 11.8/13.9 ms; serialization 9.9/13.5 ms; one-edit write volume 3,454,888 UTF-8 bytes.
- Separate 10-patient × 20-entry attachment workload: one 65,536-byte binary attachment per patient (655,360 raw bytes; 873,840 base64 characters total). Source 1,220,871 UTF-8 bytes (2,441,742 UTF-16 bytes); hydration 47.1/51.0 ms; serialization 2.2/2.5 ms; one-edit write volume 1,220,878 UTF-8 bytes.

Each entry includes a 40-repeat synthetic narrative plus structured SOAP and original source; dates/IDs are deterministic. Timings are environment-specific baselines, not budgets or claimed gains. Initial sandbox Chromium launch failed with macOS MachPort permission denial; rerun with approved sandbox escalation succeeded. W01 exited without application behavior changes before W02/W03 began. Authoritative implementation documents need no W01 update because runtime facts are unchanged; known validation gaps are retained here for W04.

## W02–W03 implementation evidence

- `src/services/ai/contracts.ts` now owns explicit task inputs/results and nested DTOs; no gateway/task signature derives from `MedicalChartResponse`. Leaf status/encounter enums remain shared for structural workflow compatibility. Full patient context remains necessary for chat/thread; all existing chart fields, including original notes, references, legacy pearls, optional collections and attachment media, have explicit projection rules. `contextAdapters.ts` preserves incoming property order and optionality. Dynamic ROS/exam/headsss dictionaries retain their clinical keys. Projections are not external-data validation.
- `geminiGateway.ts` projects chart/face-sheet/SOAP/history/course/plan at actual call sites. Positional feature actions, result application, lazy task loading, prompts, provider schemas, history truncation/order, search defaults and abort signals remain intact. Tasks/prompts now consume AI contracts. Source enums and shared text-formatting helpers remain reusable; no provider SDK types enter feature code.
- `tests/ai-context-adapters.test.ts` verifies exact existing-context JSON equality and nested future-field exclusion, including runtime File identity. `tests/ai-gateway-baseline.test.ts` compares entire request/schema/result values for all 16 gateway operations against direct task calls and checks pending-import cancellation. Existing request-identity/patient-switch tests remain in the shared suite.
- `src/services/attachmentPersistence.ts` exports durable metadata/content and recursive serialized/hydrated types. The recursive runtime algorithm and durable keys are unchanged. Typed durable hydration exposes `FileUpload | PersistedAttachment` for the legacy failure fallback. Startup/file-import shallow assertions remain known W04 gaps; this stage does not claim that all external records are validated runtime objects.
- Nested entry/note/subnote round trips compare decoded bytes `[0, 1, 127, 128, 255]`, filename, MIME, modification time and category; repeated serialization matches the durable object and removes blob URLs. Hydration allocation paths are unchanged: corrupt attachments allocate no preview and accepted siblings remain owned by the patient. Browser deletion cleanup continues to pass.
- Authoritative AI, architecture and persistence docs describe the implemented boundaries. No UI layout, clinical interpretation, storage format/version, import policy or backend was added.
