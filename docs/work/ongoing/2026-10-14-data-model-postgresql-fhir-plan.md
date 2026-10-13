# Data model preparation for PostgreSQL and FHIR

Status: planned
Owner: unassigned
Updated: 2026-10-14

## Goal

Prepare a clinically faithful, efficiently queryable data model that can move from browser persistence to PostgreSQL without coupling database changes to AI request/response schemas. This record is the canonical execution reference. The current request authorizes preparing the plan for concrete work; application implementation is not started. Follow the work packages and decision gates below when implementation is authorized.

## Scope

- Local-first preparation: contract separation, runtime validation, explicit versions, migration and compatibility adapters, identity and provenance design.
- Proposed relational model, clinical representation, FHIR mapping and verification strategy.
- Later backend/security milestones and decisions needed before production PHI handling.

## Non-goals

- Building a backend, changing providers/prompts, deploying PostgreSQL, implementing a FHIR server, or claiming HIPAA compliance now.
- Automatically converting narrative statements into verified diagnoses, prescriptions, allergies, or measurements.
- Replacing every narrative field with structured controls, or implementing the entire FHIR resource catalog.

## Context and evidence

The existing boundaries are useful: pure transitions in `src/domain/`, persistence services, and the typed AI gateway. Preserve them.

- `src/types.ts`: `MedicalChartResponse` combines demographics, encounters, entries, course, handoff, orders, medications and notes. The same types also enter `src/services/ai/ClinicalAiGateway.ts`. Changing the shared aggregate can therefore unintentionally change AI context or result requirements.
- `GeneralData` mixes patient identity with admission/discharge, location and encounter state. `ageSex`, `age`, `sex` and `dob` overlap. Historical encounters need their own facts, without rewriting old notes when demographics change.
- `SoapNote` stores vitals, labs and medications mainly as narrative. That is valuable source content but insufficient for reliable longitudinal numeric queries. Assessment text and ICD strings do not establish confirmed conditions.
- `CourseEvent.id` and several encounter links are optional. `PatientNote` is patient-scoped; do not invent an encounter link. The existing ID helper supports prefixes and legacy IDs are not guaranteed UUIDs.
- `src/services/patientPersistence.ts` validates only a shallow chart shape before migration. Legacy hydration associates entries, course events and orders with the first encounter; it does not do the equivalent for medications. Preserve existing behavior initially and document inferred associations rather than silently extending that rule.
- `src/App.tsx` exports a serialized aggregate; imports hydrate attachments through a different path from startup migration. Unify boundary behavior deliberately, with characterization tests for both paths.
- `FileUpload` mixes runtime `File`/preview values and durable bytes. Existing attachment serialization is worth retaining as a compatibility adapter.
- `src/services/ai/tasks/chartGeneration.ts` owns provider schemas and creates chart IDs locally after parsing. Keep application identity outside model authority. Handoff `patientId` also appears in generated content; treat it as legacy content until mapped to an authoritative relationship, never as a database foreign key supplied by the model.
- Browser storage and client-delivered AI credentials remain current limitations. The [server proxy](2026-10-08-server-side-ai-proxy.md) is separately deferred.

## Requirements

- **R1 — Independent contracts:** version persistence, AI task contracts and FHIR mappings independently; preserve existing feature behavior through projections.
- **R2 — Lossless migration:** retain established IDs, associations, narrative bytes/formatting, original notes, legacy fields, references and attachment bytes. Record inferred information as inferred.
- **R3 — Boundary validation:** parse external data as unknown; validate shapes and relationships before mutation. Report field paths/codes without clinical values. Failed hydration/import must not overwrite valid storage.
- **R4 — Clinical representation:** separate narrative from reviewed structured facts; represent missingness, temporal precision, code systems, units, provenance and revisions explicitly.
- **R5 — Efficient persistence:** make independently edited/queryable entities addressable without loading or rewriting the entire patient population in the future backend.
- **R6 — Scoped interoperability:** declare a FHIR release, implementation guide and supported resource/profile subset; validate mappings and disclose unmapped information.
- **R7 — Security readiness:** model access scope, actors, revisions and audit needs without claiming that schema fields enforce HIPAA obligations.

## Proposed design

### Separate the four contracts

Proposed flow: persisted records → domain records → feature projections and task-specific AI inputs; AI results → validated review candidates → intentional domain updates. A separate domain ↔ FHIR adapter handles exchange.

1. **Domain model:** clinical identities, relationships, facts and workflow state; no Gemini or React dependencies.
2. **Persistence DTOs:** explicit durable JSON shapes and schema versions, without `File`, blob URLs or provider SDK types. Future SQL rows need not mirror these objects exactly.
3. **AI DTOs:** named task inputs/results preserving current wire shapes. Replace broad `Omit<MedicalChartResponse, ...>` contracts with explicit task result types when equivalent behavior is proven. Merely aliasing a mutable domain type does not decouple it.
4. **FHIR resources:** release/profile-specific exchange shapes, independently mapped and validated.

Initially retain `src/types.ts` as the public compatibility surface for existing consumers. Extract only types with a real boundary consumer, with documented ownership and a later removal path for temporary re-exports. Proposed owners: `src/domain/` for domain records/transitions; `src/services/` for durable codecs and migrations; `src/services/ai/` for AI DTOs and task adapters; a future `src/services/fhir/` only when the first mapping is implemented. Do not introduce a generic repository framework or ORM now.

Freeze provider schemas, prompt assembly, field ordering where it affects context, defaults and error behavior for the first migration. Build explicit projections rather than serializing newly enriched records wholesale into prompts. Database tenant IDs, audit metadata and unrelated attachments must not leak into AI context. Later AI extraction or context-budget improvements are separately versioned behavior changes.

### Relational core and flexible documents

The following are proposed entities, not a committed SQL schema:

- **Patient and patient identifiers:** stable internal ID; repeated business identifiers with issuer/system, value and validity. MRNs are scoped to their issuing organization, not universally unique. Preserve original names and addresses while adding structured parts only when known. Do not automatically merge patients with similar names or identifiers.
- **Encounter:** patient relationship, type/class, workflow status, period, location and participants. Keep death facts at patient level. Present legacy patient status as a projection of the selected/current encounter plus patient facts; do not change current transition behavior in the preparation phase.
- **Clinical document and revision:** entry/note identity, patient, optional encounter, document kind, effective time, author, review state and ordered immutable revisions. Store SOAP sections as versioned JSON and exact narrative/source as text. Preserve thread/subnote identity and ordering; free notes need not be forced into a SOAP structure.
- **Course event and handoff revision:** stable identities, effective time, source links and encounter scope when known. Handoff is an authored/generated summary with an explicit patient relationship, not the source of truth for every clinical problem.
- **Service order and medication request:** patient/encounter relationships, status, intent, requester, time, original instruction and structured detail when verified. Preserve grouping and sort order. Do not merge operational medication-category orders and prescription records without an explicit reconciliation/linking workflow.
- **Clinical facts, introduced by workflow:** observations, conditions, allergies, medication statements and diagnostic reports. Keep prescription, reported medication use, administration and dispensing distinct. Do not create administration records from a prescription.
- **Attachment and attachment links:** stable ID, content type, filename, size, integrity hash and durable content reference; link to the owning document/revision. Keep file bytes in current exports. Later object storage can hold large content while PostgreSQL holds metadata and authorized references; avoid public or persisted expiring URLs.
- **Provenance and revision relationships:** source entry/revision/attachment, originating system or actor, extraction method, effective/recorded times, review actor/time and supersession. AI-generated, imported, manual and legacy-unknown are distinct origins; none implies clinician verification.
- **Later server entities:** organization/security tenant, user/practitioner membership, access grants and audit events. A clinical organization and a security tenant are different concepts. Authentication identity and a historical document author also need not be the same record.

Use relational columns for identity, foreign keys, timestamps, statuses and frequently filtered facts. Use bounded, versioned JSONB for evolving document sections and structured details with low query demand. Avoid both a single giant patient JSONB row and a universal entity-attribute-value table. PostgreSQL JSONB supports indexing, but does not preserve original JSON whitespace/key order; retain source artifacts separately if exact source fidelity matters. See [PostgreSQL JSON types](https://www.postgresql.org/docs/current/datatype-json.html).

### Represent facts without false precision

- A coded concept needs original text plus zero or more codings with system URI, code, display and optional version. A guessed code must not replace source terminology. Choose terminology by exchange partner/jurisdiction and licensing; consider LOINC for observations, UCUM for units, and appropriate diagnosis/medication terminologies.
- An observation needs a typed value, unit, effective time, status, source and optional interpretation/reference range. Preserve comparators such as less-than, decimal precision and original unit text. Distinguish zero from missing. Use decimal strings at JSON boundaries and appropriate SQL numeric values where exact decimals matter.
- Represent absence reasons explicitly where meaningful: unknown, not asked, declined and not applicable are not synonymous. Empty arrays cannot assert “no known allergies.” Keep legacy “Not Recorded” source text while mapping to missing values only under documented rules.
- Store date-only birth dates as dates, not midnight timestamps. Partial dates retain precision. Store actual instants separately from local dates/times and their known offsets/zones; do not infer UTC for ambiguous legacy times. Migration timestamp is not clinical occurrence time.
- Derive display age at the relevant date when DOB is known; retain reported age with its date/unit/source when DOB is absent. Do not back-calculate an exact DOB. Preserve ambiguous legacy sex text; administrative gender, sex-related clinical attributes and gender identity must not be silently equated.
- Conditions need clinical and verification status, onset/abatement and provenance. Differential diagnosis remains a hypothesis until an explicit workflow establishes otherwise. Structured extraction proposes facts for review; it never overwrites the original note.
- Versioned document edits create a new revision rather than destroying provenance. Legacy content begins with unknown review/author state unless evidence establishes otherwise. A document review status does not automatically verify every extracted fact.

### Identity, migration and validation

Keep current IDs opaque strings during preparation. A future database can retain text primary keys initially. If UUID internal keys are later selected, preserve old public IDs via a unique mapping and migrate every relationship transactionally; do not cast arbitrary existing IDs to UUID or regenerate them during hydration.

Introduce an envelope such as `{ schemaVersion, patients }` only in a separately tested migration. Accept existing bare arrays for storage and existing single/multiple case exports. A newer version must be rejected non-destructively by older readers; never reinterpret it as empty data. Keep schema version, record revision, AI contract version and FHIR version separate.

Migrations must be deterministic after the first successful write: assign missing IDs once, persist a migration identity map, and avoid retry-generated identities when writes fail. Preserve legacy first-encounter associations with migration provenance; ambiguous new imports should remain unassigned or require reconciliation. Assert patient ownership for every encounter link. Conflicting IDs on import must prompt reconciliation or reject with a useful error, never overwrite or silently duplicate. An explicit “copy as new” action may remap the complete graph in a later scope.

Choose one runtime validation approach after a small spike, then infer TypeScript types where practical. Do not add competing schema libraries. Provider response schemas are constrained by the provider and should remain separately owned; do not blindly generate them from database validators. Validate malformed nested fields, bounded depth/size, invalid references and attachment metadata/content before allocating resources. Preserve unknown legacy fields through compatibility storage when possible; never silently drop potentially clinical content. Unsupported future versions are a hard stop.

### Efficiency and concurrency

Start with measurements: synthetic small/large cohorts, entries per chart and attachment volume. Measure hydration, serialization time, bytes written per edit, peak memory and AI context size. Schema normalization alone does not remove localStorage whole-snapshot write cost. IndexedDB is an optional separate browser-storage project if measured attachment/size limits justify it.

For PostgreSQL, propose patient timeline indexes on security scope, patient and effective time plus stable ID; order worklists on scope/status/target date; and scoped identifier lookup indexes. Verify against actual query predicates and `EXPLAIN (ANALYZE, BUFFERS)` on synthetic datasets before adding broad JSONB/GIN indexes. Use keyset pagination, summary projections, lazy attachment retrieval and transactions for related updates. Avoid premature partitioning, sharding and per-field tables.

Future writes include expected record revision; a stale update returns a conflict rather than overwriting newer work. Keep history and present a reconciliation workflow. Cross-tenant ownership must be enforced at API/database boundaries with appropriately scoped foreign keys; row-level security is defense in depth, with explicit tests for privileged/service roles. See [PostgreSQL data definition](https://www.postgresql.org/docs/current/ddl.html). Browser-only tenant labels and audit rows are not trusted security controls.

### FHIR compatibility

Treat FHIR as an exchange contract. Provisional prototype target: R4 4.0.1, to be replaced if the actual integration partner requires R4B/R5 or another release. Select and pin the implementation guide and terminology package before claiming conformance; US Core is appropriate only when required by the target use case, not simply because HIPAA is mentioned. [HL7 versioning](https://fhir.hl7.org/fhir/versions.html) and [validation](https://hl7.org/fhir/R4/validation.html) describe release/profile-dependent validation.

Proposed mappings, subject to profile requirements:

- Patient identity → Patient; encounter → Encounter. Keep external logical resource IDs, server namespace, business identifiers and local IDs separate.
- Reviewed measurements → Observation; report context → DiagnosticReport. Narrative labs alone need not become numeric observations. See [Observation boundaries](https://hl7.org/fhir/R4/observation.html).
- Reviewed diagnoses → Condition; reviewed allergies → AllergyIntolerance; distinguish missing allergy history from a documented negative assertion.
- Prescription intent → [MedicationRequest](https://hl7.org/fhir/R4/medicationrequest.html); requested diagnostic/procedure work → [ServiceRequest](https://hl7.org/fhir/R4/servicerequest.html). Internal status enums need explicit semantic mappings; “DONE” on an operational task does not prove a clinical procedure occurred.
- Notes/attachments → [DocumentReference](https://hl7.org/fhir/R4/documentreference.html); consider Composition plus a document Bundle only when a complete FHIR document is required. SOAP JSON is not automatically a valid FHIR document.
- Record derivation → [Provenance](https://hl7.org/fhir/R4/provenance.html); access/use events → [AuditEvent](https://www.hl7.org/fhir/R4/auditevent.html). They serve distinct purposes.

First interoperability slice: synthetic Patient + Encounter + DocumentReference export, then reviewed vital-sign Observation. Validate base resource rules, required profile fields, terminology and references. Fail with an actionable mapping report when required information is absent; do not fabricate author, status or codes to pass validation. Preserve original incoming resources/unknown extensions under governed storage, and reject unsupported modifier extensions that prevent safe interpretation. Document losses and unsupported elements rather than promise universal lossless FHIR round trips. A full API adds search, authorization, paging, history, CapabilityStatement and other separately scoped obligations; HL7 v2 messaging is also separate.

### HIPAA readiness

HIPAA is not a schema certification. Applicability depends on the organization, role and processing arrangements; jurisdiction and intended customers remain decisions. HHS describes administrative, physical and technical safeguards, not just database fields. See the [Security Rule summary](https://www.hhs.gov/hipaa/for-professionals/security/laws-regulations/index.html).

Before production PHI use, require a documented risk analysis, identity/access design, authorized purpose and data minimization, secure sessions, encryption/key management, auditable access and changes, tested recovery, retention/deletion policy, incident/breach procedures and workforce/operational responsibilities. These are proposed release gates, not a claim that every named mechanism is a universally prescribed implementation. See [HHS risk analysis guidance](https://www.hhs.gov/hipaa/for-professionals/security/guidance/guidance-risk-analysis/index.html).

Review hosting, storage, AI and other relevant processors and applicable BAAs. HHS explains that cloud safeguards and appropriate business associate arrangements remain necessary even with encryption. Do not assume the current Gemini access method is eligible for PHI; verify the exact service, contract, retention and deployment. See [HHS cloud guidance](https://www.hhs.gov/hipaa/for-professionals/special-topics/health-information-technology/cloud-computing/index.html).

Keep patient information out of telemetry, URLs and audit event payloads unless specifically required and protected. Audit logs should capture actor/action/target/outcome/time without duplicating clinical narrative; they can themselves be sensitive. A browser log is not tamper-resistant evidence. Separate original clinical source retention from raw AI prompt logging: retaining source documents does not authorize retaining every provider request/response. Retention periods require a policy decision; do not apply a blanket duration to all medical records.

## Execution work packages

Use this section as the implementation checklist. All packages are initially **not started**, owner **unassigned**. “Ready” describes specification readiness, not authorization to modify application code. Claim one package here before work, record its commit/PR and actual checks at completion, and do not mark downstream packages complete from upstream evidence. Keep this as the canonical tracker rather than creating competing phase trackers.

Dependency order: **W01 → W02 and W03 → W04 → W05 → W06**. W07 follows W06 and its clinical gate; W08 follows the required domain packages and its interoperability gate. W09/W10 are separately scoped future projects. Each package should form one reviewable change; split within a package if needed without mixing compatibility work with behavior changes.

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

### W06 — Patient/encounter ownership and provenance

Readiness: gated by D2 and W05. Requirements: R2, R4–R5. Acceptance: AC2, AC4–AC6.

- Draft the field-by-field ownership/migration map in this tracker before code: patient demographics/death; encounter admission/discharge/location/status; document content; inferred legacy links; retained unknown fields. Resolve conflicts explicitly without choosing a clinical truth silently.
- Introduce domain records under `src/domain/` only for these owners, with a projection back to the current feature chart shape. Update patient factories/transitions, store coordination and codecs as one coherent vertical slice.
- Keep opaque IDs and patient-scoped notes. Add provenance only where actual evidence exists; use legacy-unknown otherwise. Do not manufacture authors, review decisions or clinical occurrence times.
- Specify the selected/current encounter rule under D2 before deriving face-sheet fields. Preserve existing patient-status interactions until that rule and its tests are approved.
- Exit: projection and migration fixtures demonstrate preserved clinical content, explicit conflict handling, stable relationships and unchanged AI payloads. No new clinical fact extraction in this package.

### W07 — Reviewed structured facts and revision workflow

Readiness: gated by D3 and W06. Requirements: R4–R5. Acceptance: AC4–AC6.

- Default candidate scope is manually entered/reviewed vital observations; approve exact fields, units, missingness, source links and review UX before implementation. AI extraction is an optional later task contract, not part of DTO isolation.
- Specify create/edit/cancel/review/amend behavior, document vs fact review state, supersession and encounter-switch handling. Define how revisions relate to existing editable notes before promising immutable history.
- Add domain types, validators, persistence and owning feature UI together. Use exact decimal/source representations and explicit temporal precision. Keep narrative available and unchanged.
- Exit: synthetic tests demonstrate all AC4 cases and no unreviewed fact becomes verified through import or AI output. Update product/data documentation and compare measurements with W01.

### W08 — Narrow FHIR exchange implementation

Readiness: gated by D4 and relevant W06/W07 records. Requirements: R6. Acceptance: AC7.

- Record pinned FHIR release, implementation-guide/terminology package versions, resource profiles, exchange direction and mapping-loss policy before adding `src/services/fhir/`.
- Implement synthetic Patient/Encounter/DocumentReference export first. Add Observation only after W07; do not require structured facts for a document-only slice.
- Create field/status/reference mappings and validator fixtures. Missing mandatory data yields an explicit mapping error, never fabricated facts. Validate offline with pinned packages and synthetic resources.
- Exit: reproducible validator command, passing supported fixtures, failing unsupported/missing-reference cases and a supported-profile statement. No FHIR server/API or broad interoperability claim.

### W09 — PostgreSQL implementation specification and migration

Readiness: gated by D5; separate backend authorization required. Requirements: R5, R7. Acceptance: AC6, AC8.

- Before backend code, create the concrete schema/API design in this record: entity fields, nullability, foreign keys, identifier uniqueness, tenant scope, deletion/amendment policy, revisions, idempotency and attachment lifecycle. Select hosting/ORM only against those requirements.
- Specify browser-to-server ownership, offline behavior, authentication, access controls and the deferred AI proxy dependency. Model cross-record transactions and conflict responses; do not assume browser state is trusted.
- Implement and rehearse a synthetic migration with ID/content reconciliation, failed-batch retry, concurrent writes, query plans and rollback/restore. Include post-cutover writes in recovery tests.
- Exit: versioned SQL migrations, tested authorization/isolation and restore evidence, measured query plans and explicit rollout procedure. Keep this package deferred until its separate scope is authorized.

### W10 — Production security and privacy readiness

Readiness: gated by D5/D6 and W09. Requirements: R7. Acceptance: AC8.

- Assign security/privacy and operational owners. Produce deployment-specific threat/risk assessment, vendor/service eligibility and contractual review, access/audit controls, backup/restore evidence, retention/deletion and incident response procedures.
- Evaluate production readiness against the actual deployment and applicable obligations. Recheck authoritative guidance and provider terms at that time; this dated plan is not a compliance determination.
- Exit: owner-approved evidence and resolved release blockers. A passing application test suite is not an approval substitute.

## Execution decision gates

- **D1 — Storage/export cutover:** before W05, confirm recovery-copy strategy, minimum compatible application version, backup cleanup and whether case exports stay legacy or gain a separate versioned format. Proposed default: preserve legacy export until richer fields exist; always provide full-fidelity export before writing data legacy export cannot represent.
- **D2 — Encounter ownership:** before W06, product owner confirms selected/current encounter semantics, treatment of multiple active encounters and conflicting historical face-sheet values. Until then preserve current transitions.
- **D3 — Clinical workflow:** before W07, clinical/product owner selects the first structured fact workflow and author/reviewer/amendment rules. No inferred clinical policy.
- **D4 — Exchange contract:** before W08, integration owner supplies partner/jurisdiction, release, profiles, terminology and export/import/API scope. R4 remains a prototype assumption only.
- **D5 — Deployment:** before W09, product/security owners choose tenancy, offline requirements, data location, access model and retention/deletion constraints. Backend and proxy remain separately authorized work.
- **D6 — Production approval:** before W10 closure, named security/privacy/operations owners resolve applicable obligations, processor arrangements and release criteria.

W04's atomic rejection and duplicate-ID rejection are bounded execution defaults for the preparation scope. Record a user-requested alternative here before implementation; do not stall W01–W03 on later gates or silently expand into a merge/reconciliation UI.

## Package verification commands and handoff

For W01–W05, run the relevant focused checks, then the shared-contract suite once the package is complete:

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

Run only the relevant focused groups during development. For runtime persistence/import changes, additionally run:

```sh
npm run test:e2e -- tests/e2e/persistence.spec.ts tests/e2e/input-workflow.spec.ts tests/e2e/patient-navigation.spec.ts
```

Add browser chat coverage when AI action plumbing changes. W06–W10 require the tests defined in their packages in addition to applicable repository checks; FHIR/SQL/security commands must be specified when their tooling is selected, not guessed now. New tests must cover meaningful contracts, and all provider interactions remain mocked/offline.

At each handoff, replace current package state with: owner, status, affected paths, commit/PR if present, requirement/AC evidence, actual commands/results, remaining failures, storage-format compatibility and exact next action. Mark this tracker active only when implementation begins. Move it to done only when its agreed scope is complete; if later phases become separately scoped projects, link their canonical records and explicitly record the reduced scope rather than checking off deferred work.

First implementation instruction: **Execute W01 only, preserve application behavior, record baseline evidence and contract gaps here, and run the relevant checks. Proceed to W02 only when W01's exit conditions pass and implementation scope permits it.**

## Acceptance criteria and verification plan

- [ ] **AC1 (R1):** Existing synthetic inputs produce equivalent task request payloads/schemas and parsed result shapes across the migration. Extend `tests/ai-actions.test.ts`, `tests/ai-task-contracts.test.ts`, `tests/response-parsing.test.ts` and `tests/gemini-transport.test.ts`; no live provider calls.
- [ ] **AC2 (R2):** Legacy load → migrate → save → reload preserves IDs, relationships, original text, references, `clinicalPearl` and attachment bytes/metadata. A second migration yields the same identities. Cover missing IDs and write-failure retries in persistence/attachment tests.
- [ ] **AC3 (R3):** Empty collection succeeds; malformed nested data, unknown versions, wrong-patient references, conflicting IDs and corrupt attachments produce actionable errors without overwriting storage or silently losing records. Verify import and reload browser paths.
- [ ] **AC4 (R4):** Date-only/partial dates, ambiguous local time, reported age, missing vs zero, less-than quantities and unreviewed AI facts survive round trips. No narrative rewrite or automatic promotion to verified facts.
- [ ] **AC5 (R1–R4):** Cancelled AI work and patient/encounter switches never apply results to a different record; capture target identity/revision before invocation and check before commit. Existing review/edit/save/cancel and resource cleanup behavior remains intact.
- [ ] **AC6 (R5):** Document benchmark datasets and before/after hydration/write/context metrics. Set budgets from that baseline before implementation; do not assert performance gains from modeling alone. Future SQL phase includes query plans and concurrent-update tests.
- [ ] **AC7 (R6):** Each supported FHIR fixture passes the pinned profile validator; missing required fields and unresolved references fail explicitly. Unsupported fields and mapping loss are reported. No broad conformance claim beyond the tested subset.
- [ ] **AC8 (R7):** Backend and production phases cannot close without isolation, access audit, recovery and operational assessment evidence appropriate to the deployed system.

Application changes require `npm run typecheck`, `npm run build`, relevant focused tests and the shared-contract unit suite. Run browser reload/import/export and affected clinical workflows. Documentation changes require `npm run docs:check` and `npm run format:check`. Passing tests does not establish clinical accuracy, live provider behavior, interoperability with an untested partner or legal compliance.

## Risks and recovery

Keep a verified original export before migration; stage and validate the new snapshot before replacing the old one. Where browser quota prevents retaining both, fail visibly rather than discarding the original. Do not dual-write independently editable old/new models: use one canonical writer and derived compatibility projections.

Rolling code back does not make newer data readable by old code. Define compatible reader versions and restore/export tooling before cutover. Legacy export can represent only legacy fields; label any loss, retain a full-fidelity new export, and never use a lossy legacy export as the only backup. Future server cutover needs an explicit write pause or reconciliation protocol, validated counts/relationships/content hashes, a tested restore point and rules for writes made after cutover.

## Decisions and open questions

Planning baseline: hybrid relational/document model, frozen AI contracts with adapters, gradual reviewed structured facts, and FHIR at the exchange boundary. Use the package defaults for preparation work; the explicit decision gates remain unresolved and this plan does not authorize deployment.

- **Target environment:** single clinician, clinic or multiple independent organizations? This blocks tenant/access and final SQL design; does not block characterization and AI DTO isolation.
- **Interoperability:** which country, EHR/exchange partner, FHIR release/guide and import/export/API use case? This blocks conformance claims and final mappings.
- **Clinical priorities:** vital/lab trends, medication reconciliation, allergy safety or problem lists first? Default proposal is reviewed vitals; clinical stakeholders must approve the review workflow.
- **Offline and retention:** must edits work offline after server migration; who can amend/delete records and what must be retained? This blocks sync and production retention design.
- **Security ownership:** who determines HIPAA applicability, signs processor arrangements and approves the production deployment?

Readiness: W01 is ready; W02–W04 have concrete scope and become ready after their dependencies. W05–W10 require the named decision gates. Collision behavior for W04 is specified as atomic rejection; interactive reconciliation is excluded. No backend implementation is authorized now.

## Documentation impact

Current implementation facts have not changed, so authoritative architecture/data/AI/operations documents remain unchanged. Upon implementation, update `docs/data-and-persistence.md` for durable versions/migrations, `docs/ai-integration.md` for DTO boundaries, `docs/architecture.md` for ownership, and product/testing/operations docs for actual workflows and deployment capabilities. This proposal remains the single planning record.

## Progress

Execution reference prepared with W01–W10, dependencies, concrete owners/paths, exit conditions, verification commands and D1–D6 gates. Import parser, attachment serialization and patient-store call sites inspected to ground the packages. All packages remain not started. Next implementation action: claim W01 and produce its characterization fixtures and baseline evidence; later policy gates do not block that package.

## Verification

`npm run docs:check` and `npm run format:check` passed for this documentation-only change. No runtime code changed; proposed application, migration, FHIR, database and security checks have not run.

## Outcome

Concrete execution reference delivered; planning acceptance is satisfied by the scoped packages, dependencies, file ownership, verification commands, decision gates and handoff instructions. This record remains planned because its implementation acceptance criteria are future work; it does not claim the data model, PostgreSQL migration, FHIR compatibility or HIPAA readiness has been implemented.
