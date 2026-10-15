# Data model stage 2: validated, versioned persistence

Status: planned
Owner: unassigned
Updated: 2026-10-15

Parent: [Data model roadmap](2026-10-14-data-model-postgresql-fhir-plan.md)
Prerequisite: [Contract baseline and isolation](../done/2026-10-15-data-model-stage-1-contract-isolation.md)

## Goal

Unify durable-data validation without changing the current writer, then introduce a versioned writer only after its recovery and compatibility decisions are resolved. This tracker owns W04–W05. Stage 1 is complete; this stage remains planned and unstarted.

## Scope

- Shared validated readers for storage and existing import entry points.
- Atomic rejection of invalid/conflicting imports with safe feedback.
- A separately gated storage-version rollout with tested recovery and stable identities.

## Non-goals

Interactive patient merge/copy workflows, new array-in-one-file imports, automatic clinical normalization, a redesigned relational domain, new clinical facts, IndexedDB, PostgreSQL and FHIR implementation. Preserve existing UI structure; intentional validation feedback changes stay with the current input and app owners.

## Readiness and dependencies

W04 can begin after stage 1 supplies its accepted-shape inventory, isolated AI contracts and durable attachment types. W05 is not execution-ready until W04 passes and parent gate D1 is resolved. W04 may implement legacy validation independently; its optional future-envelope reader requires an exact agreed format, so do not invent migration metadata merely to finish W04. Record that format here before implementing reader support, and release a compatible reader before enabling W05's writer.

## Package state

- W04: ready, not started; owner unassigned; stage 1 prerequisites complete; next action when authorized: claim W04 and compare validator approaches.
- W05: not started; owner unassigned; dependencies: W04, exact envelope contract and D1 resolution.

## Shared constraints and source documents

Inherit requirement IDs R1–R7, outcome IDs AC1–AC8, clinical invariants and decision gates from the parent. Package references to ACs indicate contribution to those outcomes, not completion of the entire roadmap. Stage acceptance below is the closure checklist; do not duplicate it in the parent.

Read [architecture](../../architecture.md), [data and persistence](../../data-and-persistence.md), [AI integration](../../ai-integration.md) and [testing](../../testing.md) before implementation. Reinspect the working tree and applicable AGENTS.md files; named new modules are proposed locations, not existing files. Preserve unrelated work and use synthetic offline fixtures only.

## Work packages

### W04 — Shared validated readers, unchanged writer

Readiness: ready after W02/W03 and W01's accepted-shape inventory. Requirements: R2–R3. Acceptance: AC2–AC3, AC5.

- Add proposed `src/services/patientCodec.ts` with pure unknown-input parsing and path/code-only issues. Reuse it from `patientPersistence.ts` and `src/features/input/importCases.ts`; keep file reading and UI feedback in their current owners. Validate before hydrating files or changing state.
- First implementation decision: compare extending existing guards against one runtime schema library using the same nested legacy fixture. Record the choice, bundle impact and handling of unknown fields here. Prefer existing guards if they meet the requirements without duplicating shapes; add no dependency without evidence.
- Plan default: reject a malformed import batch atomically with safe errors and keep existing data intact. Reject duplicate patient IDs within the batch or against the current store; do not auto-merge, auto-overwrite or offer copy-as-new in this scope. Check collisions against current state at commit time, not only before asynchronous file reads. Preserve startup's non-destructive failure behavior.
- Preserve optional legacy fields and unknown JSON fields in the compatibility payload. Validate known nested shapes and associations; do not coerce prose or ambiguous dates into structured clinical facts. Keep existing legacy encounter inference distinct from rejection of an explicitly wrong-patient encounter link.
- Validate base64 and known metadata without rewriting bytes. Define input-size/depth limits from W01 evidence and document them before enforcement; errors must explain supported limits without echoing filenames or clinical content.
- Continue writing the current storage array and case-object exports. Add reader support for the proposed version-1 envelope only under a documented exact schema, with unsupported versions rejected non-destructively. Distinguish absent data, an empty valid collection, invalid JSON and unsupported version.
- Exit: storage/import paths share shape rules, appropriate legacy inputs remain accepted, invalid batches have zero state changes, and current write output is unchanged. Update data/product docs for intentional validation behavior changes.

### W05 — Versioned storage rollout and recovery

Readiness: gated by D1 and W04. Requirements: R2–R3. Acceptance: AC2–AC3, AC5.

- Add proposed `src/services/patientMigrations.ts` for pure ordered version transitions. Version 1 retains the legacy chart payload plus explicit migration metadata; it does not normalize every entity. Document the exact storage envelope and distinguish it from case-export format.
- Keep established IDs. Assign missing IDs using an injected migration context and persist the allocation map with the migrated snapshot. Specify deterministic restart behavior from unchanged legacy input; an in-memory cache alone does not satisfy retry stability across reloads.
- Define staged write/validation/commit and startup recovery states before enabling the writer: legacy only, valid staged data, completed commit, failed commit and corrupt staged data. Use `safeStorage` and existing error feedback. Session-memory fallback is not proof of durable commit.
- Preserve a recovery copy or verified full-fidelity export; if quota prevents a safe cutover, leave the original durable value intact and report the blocker. Never clear the original to make space before recovery is verified.
- Keep the versioned reader released before the new writer. Document minimum compatible reader, recovery location, cleanup timing and how old clients behave. Existing deployed readers cannot be retroactively made forward-compatible.
- Exit: interruption/quota/reload tests at each write boundary preserve a readable original or verified new snapshot; repeated migrations preserve identities. Release notes and data docs explain rollback limits and export compatibility.

## Decisions required before writer work

D1 remains owned by the parent: recovery-copy strategy, compatible application versions, backup cleanup and export policy. Link its resolution here before W05. The exact versioned envelope, allocation-map representation and crash-recovery state machine are W05 design deliverables that must be reviewed before enabling writes; they are not settled by the illustrative parent shape.

For W04, atomic batch rejection and duplicate-patient-ID rejection are the execution defaults. Preserve unknown fields and legacy optionality. A different policy requires an explicit scoped revision; do not implement an unplanned reconciliation UI. The schema-library choice and size/depth limits are engineering decisions supported by stage 1 evidence and recorded here.

## Acceptance criteria

- [ ] S2-AC1 (W04; R2–R3): storage and actual file-import entry points use shared validated shape rules; valid legacy inputs and empty collections retain their supported behavior.
- [ ] S2-AC2 (W04; R3): malformed nested records, corrupt attachment data, wrong-patient references and duplicate patient IDs cause safe errors and zero partial import mutations; validation errors exclude clinical values and filenames.
- [ ] S2-AC3 (W04; R1–R3): source text, unknown compatibility fields, IDs, references and attachment bytes are preserved; provider payloads remain equivalent and the existing writer/export output is unchanged.
- [ ] S2-AC4 (W05; R2): after D1 resolution, the exact envelope and restart-safe identity allocation are documented and migration/reload/retry preserves IDs and relationships without inventing clinical facts.
- [ ] S2-AC5 (W05; R2–R3): tests at every staged-write/commit boundary prove interruption, corrupt staging and quota failures retain a readable original or verified new snapshot; memory fallback is not treated as durable success.
- [ ] S2-AC6 (W04–W05; R3): unknown future versions fail without destructive writes; a compatible reader precedes the writer and the tested rollback/export policy is documented.
- [ ] S2-AC7: applicable checks pass, data/product documentation describes the implemented behavior, and the later domain stage receives explicit version, compatibility and recovery evidence.

W04 may be delivered independently while W05 remains gated. Keep this stage open until both packages pass, or explicitly rescope it with a linked successor; do not count a reader-only delivery as writer completion.

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

Add targeted new codec/migration tests as their modules are introduced. Include empty input, malformed data, duplicate IDs introduced while asynchronous import reads are pending, unsupported versions, missing-ID retry across reload, and every write-failure boundary. Run browser checks after runtime persistence/import changes:

```sh
npm run test:e2e -- tests/e2e/persistence.spec.ts tests/e2e/input-workflow.spec.ts tests/e2e/patient-navigation.spec.ts
```

W04 acceptance must demonstrate unchanged write format. W05 acceptance must demonstrate the newly documented format and recovery path; do not apply W04's unchanged-writer assertion to the completed W05 rollout.

## Risks and recovery

Stricter validation can accidentally reject valid legacy data; stage 1 fixtures must distinguish supported missing fields from malformed values. Validate before allocating preview URLs and release any partial resources on failure. Collision checks must use the latest state at commit. Do not emit valid-looking empty data after parsing failure.

For W05, inherit the parent's recovery invariants. Preserve the original snapshot until staged data is verified; fail visibly if quota prevents safe migration. Define handling of each interrupted state and test reload recovery before enabling the writer. Code rollback alone does not downgrade data; do not delete the only recoverable copy or promise compatibility with unmodified old clients.

## Documentation impact

Update `docs/data-and-persistence.md` for implemented validators, versions, migrations and recovery; update `docs/product.md` for import feedback and `docs/testing.md` when new verification tooling is introduced. Storage changes do not authorize changing AI schemas or the deferred server proxy.

## Progress

Planning split complete. Next action after stage 1: inspect its inventory and benchmark evidence, claim W04 and select the validation approach. No codecs, migrations or storage writes have been implemented for this stage. Resolve D1 before W05 work.

## Handoff and closure

Update each package's owner/status and record affected paths, commit/PR if present, acceptance evidence, actual commands/results, failures, compatibility limits and exact next action. Keep detailed evidence here; the parent owns only shared scope, dependencies and gates. Move this same stage file to `done/` after its acceptance criteria pass, repair incoming links in the parent and sibling stage, and hand off the required evidence. Do not mark deferred packages complete or close the parent solely because this stage is complete.

## Verification

Planning-document checks passed: `npm run docs:check` and `npm run format:check`. Implementation tests and benchmarks have not run for this stage.

## Outcome

Execution tracker prepared. No implementation started; implementation acceptance remains unchecked.

## Stage 1 handoff

The [completed prerequisite tracker](../done/2026-10-15-data-model-stage-1-contract-isolation.md#w01-contract-inventory-and-exit-evidence) contains the W01 accepted-shape inventory, unsafe current behaviors and reproducible browser baseline, plus W02/W03 boundary changes and verification evidence. Use that inventory before choosing W04 validation rules; do not infer new file-format support from the internal batch handler. Current startup, single-file and handler paths deliberately still differ. Duplicate IDs, malformed nested records and corrupt attachment fallback remain W04 work. `src/services/ai/contracts.ts`/`contextAdapters.ts` own the frozen task boundary; `PersistedAttachment`, `PersistedFileMetadata` and `SerializedAttachments<T>` in `attachmentPersistence.ts` describe the unchanged durable attachment writer. No stage 2 implementation is included in stage 1.
