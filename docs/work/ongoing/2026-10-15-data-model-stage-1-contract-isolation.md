# Data model stage 1: contract baseline and isolation

Status: planned
Owner: unassigned
Updated: 2026-10-15

Parent: [Data model roadmap](2026-10-14-data-model-postgresql-fhir-plan.md)
Next stage: [Validated, versioned persistence](2026-10-15-data-model-stage-2-versioned-persistence.md)

## Goal

Establish tested compatibility boundaries for AI and durable attachments before changing the persisted patient model. This tracker owns W01–W03 and their execution evidence. The current request creates planning files only.

## Scope

- Characterize current AI, storage and import contracts and measure synthetic persistence costs.
- Isolate explicit AI task DTOs and projections without changing provider behavior.
- Distinguish durable attachment data from runtime files while preserving serialized output.

## Non-goals

Storage format changes, stricter import policy, clinical workflow redesign, PostgreSQL, FHIR adapters and production security infrastructure belong to later stages. No new UI layout is planned; existing accessibility, review/edit and identity-switch behavior must remain intact.

## Readiness and dependencies

Ready to begin W01 when implementation is authorized. W02 and W03 depend on W01; both must pass before stage 2 starts W04. No D1–D6 decision blocks this stage. Execute W01 first; do not make runtime fixes while characterizing baseline gaps.

## Package state

- W01: not started; owner unassigned; next action: inspect contracts and add characterization fixtures.
- W02: not started; owner unassigned; dependency: W01 exit evidence.
- W03: not started; owner unassigned; dependency: W01 exit evidence.

## Shared constraints and source documents

Inherit requirement IDs R1–R7, outcome IDs AC1–AC8, clinical invariants and decision gates from the parent. Package references to ACs indicate contribution to those outcomes, not completion of the entire roadmap. Stage acceptance below is the closure checklist; do not duplicate it in the parent.

Read [architecture](../../architecture.md), [data and persistence](../../data-and-persistence.md), [AI integration](../../ai-integration.md) and [testing](../../testing.md) before implementation. Reinspect the working tree and applicable AGENTS.md files; named new modules are proposed locations, not existing files. Preserve unrelated work and use synthetic offline fixtures only.

## Work packages

### W01 — Freeze existing behavior and establish baselines

Readiness: ready. Requirements: R1–R3, R5. Acceptance: baseline evidence for AC1–AC3, AC5–AC6.

- Inspect `src/types.ts`, `src/services/ai/ClinicalAiGateway.ts`, `actions.ts`, `geminiGateway.ts`, all six task modules, `patientPersistence.ts`, `attachmentPersistence.ts`, `src/features/input/importCases.ts`, `src/hooks/usePatientStore.ts` and the App import/export/write call sites.
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

- [ ] S1-AC1 (W01; R1–R3): every gateway operation and each actual storage/import entry point has a test-backed contract inventory; unsafe current behavior is recorded as a gap, not a future guarantee.
- [ ] S1-AC2 (W01; R5): reproducible synthetic benchmark setup, dataset sizes, sample method and hydration/serialization/write-volume baseline are recorded here without touching user patient storage.
- [ ] S1-AC3 (W02; R1): gateway inputs/results no longer depend on the patient aggregate, all characterized provider payload/schema/result behavior remains equivalent, and unrelated future domain fields cannot leak into AI context.
- [ ] S1-AC4 (W03; R2): durable attachment types accurately describe serialized values; supported nested attachments preserve bytes and metadata without persisted runtime Files or blob URLs.
- [ ] S1-AC5 (W02–W03; R1–R3): cancellation, patient switching, legacy source text, references and existing resource cleanup remain covered and passing; storage/export shapes remain unchanged.
- [ ] S1-AC6: relevant checks pass, implemented contract ownership is reflected in authoritative docs, and the stage 2 handoff contains the accepted-shape inventory, known gaps and baseline measurements.

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

Planning split complete. Next implementation action: claim W01, recheck current call sites and tests, and record its contract inventory and baseline evidence here. No application changes or measurements have been made for this stage.

## Handoff and closure

Update each package's owner/status and record affected paths, commit/PR if present, acceptance evidence, actual commands/results, failures, compatibility limits and exact next action. Keep detailed evidence here; the parent owns only shared scope, dependencies and gates. Move this same stage file to `done/` after its acceptance criteria pass, repair incoming links in the parent and sibling stage, and hand off the required evidence. Do not mark deferred packages complete or close the parent solely because this stage is complete.

## Verification

Planning-document checks passed: `npm run docs:check` and `npm run format:check`. Implementation tests and benchmarks have not run for this stage.

## Outcome

Execution tracker prepared. No implementation started; implementation acceptance remains unchecked.
