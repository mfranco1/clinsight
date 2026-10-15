# Data model preparation for PostgreSQL and FHIR

Status: active
Owner: unassigned
Updated: 2026-10-15

## Goal

Prepare a clinically faithful, efficiently queryable data model that can move from browser persistence to PostgreSQL without coupling database changes to AI request/response schemas. This record is the parent roadmap; linked stage trackers are the canonical execution references for their scopes. Stage 1 implementation was authorized on 2026-10-15 and is complete; its linked tracker owns detailed evidence. Later stages remain unstarted and retain the work-package dependencies and decision gates below.

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

- `src/types.ts`: `MedicalChartResponse` combines demographics, encounters, entries, course, handoff, orders, medications and notes. The same types also enter `src/services/ai/clinicalAiGateway.ts`. Changing the shared aggregate can therefore unintentionally change AI context or result requirements.
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

## Stage roadmap and ownership

This parent owns shared scope, design rationale, requirement/outcome IDs, dependencies and D1–D6 decision gates. Linked stages own their package checklists, acceptance evidence, status and handoffs. Do not maintain duplicate task checklists here. Stage 1 is complete; stages 2–6 remain unstarted.

1. [Stage 1: contract baseline and isolation](../done/2026-10-15-data-model-stage-1-contract-isolation.md) — W01–W03 complete. Contains the contract inventory, isolated AI boundary, durable attachment types, synthetic benchmark and verification evidence needed by stage 2.
2. [Stage 2: validated, versioned persistence](2026-10-15-data-model-stage-2-versioned-persistence.md) — W04–W05. Depends on stage 1. Validated readers precede writer changes; W05 requires D1. Its document explicitly distinguishes the executable reader scope from the gated writer scope.
3. **Clinical domain and provenance — W06–W07.** Create a stage document after W05 and D2/D3 clarify encounter ownership and reviewed-fact workflows. Scope: field ownership/migration map, compatibility projections, source/revision metadata and a clinically approved first fact workflow. Preserve original narrative and distinguish fact review from document review.
4. **FHIR exchange — W08.** Create a stage document after D4 identifies the partner/release/profiles and required domain records exist. Begin with Patient/Encounter/DocumentReference; Observation depends on reviewed facts. Require pinned validator evidence, explicit mappings and a loss report; do not create a server/API by implication.
5. **PostgreSQL migration — W09.** Create a separately authorized stage after D5 resolves tenancy, offline behavior and deployment. Scope the actual SQL/API constraints, auth, revisions, attachment lifecycle, proxy dependency, migration rehearsal and rollback including post-cutover writes.
6. **Production readiness — W10.** Create a stage document once deployment and security/privacy owners are known under D5/D6. Require deployment-specific risk/vendor/access/audit/retention/incident and restore evidence, not schema-based compliance claims.

Dependency order: **W01 → W02 and W03 → W04 → W05 → W06 → W07**. W08 depends on D4 and the records it exports; document-only exchange need not wait for W07. W09/W10 remain separately scoped and gated. No placeholder files are created for stages 3–6.

When a stage completes, move its file from `ongoing/` to `done/` and update incoming parent/sibling links. The parent stays open until the agreed roadmap scope is completed or explicitly revised; deferred work must never be marked complete by association.

## Execution decision gates

- **D1 — Storage/export cutover:** before W05, confirm recovery-copy strategy, minimum compatible application version, backup cleanup and whether case exports stay legacy or gain a separate versioned format. Proposed default: preserve legacy export until richer fields exist; always provide full-fidelity export before writing data legacy export cannot represent.
- **D2 — Encounter ownership:** before W06, product owner confirms selected/current encounter semantics, treatment of multiple active encounters and conflicting historical face-sheet values. Until then preserve current transitions.
- **D3 — Clinical workflow:** before W07, clinical/product owner selects the first structured fact workflow and author/reviewer/amendment rules. No inferred clinical policy.
- **D4 — Exchange contract:** before W08, integration owner supplies partner/jurisdiction, release, profiles, terminology and export/import/API scope. R4 remains a prototype assumption only.
- **D5 — Deployment:** before W09, product/security owners choose tenancy, offline requirements, data location, access model and retention/deletion constraints. Backend and proxy remain separately authorized work.
- **D6 — Production approval:** before W10 closure, named security/privacy/operations owners resolve applicable obligations, processor arrangements and release criteria.

W04's atomic rejection and duplicate-ID rejection are bounded execution defaults for the preparation scope. Record a user-requested alternative here before implementation; do not stall W01–W03 on later gates or silently expand into a merge/reconciliation UI.

## Verification and handoff ownership

Each stage contains its applicable verification commands, acceptance checklist and handoff requirements. The outcome IDs below are shared roadmap targets, not a second execution checklist. Use linked stage evidence to assess them; a single stage does not satisfy every outcome.

Stage 1 records the preserved contracts, known validation gaps and reproducible baseline. The next implementation package, when authorized, is W04 in stage 2; use that evidence before selecting validation rules and limits.

## Shared acceptance outcomes

- **AC1 (R1):** Existing synthetic inputs produce equivalent task request payloads/schemas and parsed result shapes across the migration. Extend `tests/ai-actions.test.ts`, `tests/ai-task-contracts.test.ts`, `tests/response-parsing.test.ts` and `tests/gemini-transport.test.ts`; no live provider calls.
- **AC2 (R2):** Legacy load → migrate → save → reload preserves IDs, relationships, original text, references, `clinicalPearl` and attachment bytes/metadata. A second migration yields the same identities. Cover missing IDs and write-failure retries in persistence/attachment tests.
- **AC3 (R3):** Empty collection succeeds; malformed nested data, unknown versions, wrong-patient references, conflicting IDs and corrupt attachments produce actionable errors without overwriting storage or silently losing records. Verify import and reload browser paths.
- **AC4 (R4):** Date-only/partial dates, ambiguous local time, reported age, missing vs zero, less-than quantities and unreviewed AI facts survive round trips. No narrative rewrite or automatic promotion to verified facts.
- **AC5 (R1–R4):** Cancelled AI work and patient/encounter switches never apply results to a different record; capture target identity/revision before invocation and check before commit. Existing review/edit/save/cancel and resource cleanup behavior remains intact.
- **AC6 (R5):** Document benchmark datasets and before/after hydration/write/context metrics. Set budgets from that baseline before implementation; do not assert performance gains from modeling alone. Future SQL phase includes query plans and concurrent-update tests.
- **AC7 (R6):** Each supported FHIR fixture passes the pinned profile validator; missing required fields and unresolved references fail explicitly. Unsupported fields and mapping loss are reported. No broad conformance claim beyond the tested subset.
- **AC8 (R7):** Backend and production phases cannot close without isolation, access audit, recovery and operational assessment evidence appropriate to the deployed system.

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

Readiness: W01–W03 are complete; W04 has its stage 1 prerequisites and is ready for a separately authorized stage 2 implementation. W05–W10 require the named decision gates. Collision behavior for W04 is specified as atomic rejection; interactive reconciliation is excluded. No backend implementation is authorized now.

## Documentation impact

Stage 1 updated `docs/data-and-persistence.md` for durable attachment types, `docs/ai-integration.md` for explicit DTOs/projections and `docs/architecture.md` for implemented ownership. Later changes must update their authoritative documents when runtime facts change; storage versions, backend operations and clinical workflows remain future work. This roadmap owns the shared proposal; linked stage records own their execution details without duplicating this design.

## Progress

Stage 1 is complete and archived under `done/`; stage 2 retains its planned tracker under `ongoing/`. Stages 3–6 remain gated roadmap summaries without placeholder documents. Next action when authorized: claim W04 in stage 2 using stage 1 evidence. Resolve later decisions only before the work they gate.

## Verification

Stage 1 contains actual focused/full unit, browser, build, bundle-size, documentation and synthetic benchmark evidence. Its passing checks do not establish live AI correctness, FHIR conformance, database migration or production readiness. This roadmap update passes `npm run docs:check` and `npm run format:check`.

## Outcome

Stage 1 completed without changing provider prompts/schemas or durable patient formats. The parent remains active; stage 2 is planned and later stages remain gated. No PostgreSQL migration, FHIR compatibility or production readiness is claimed.
