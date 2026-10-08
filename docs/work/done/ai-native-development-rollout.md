# AI-native development rollout

Status: done
Owner: Codex
Updated: 2026-10-08

## Goal and scope

Make ClinSight easy for an agent or human to understand, change, verify, and hand off. Keep documentation accurate through the normal development workflow, with one authoritative home for each kind of information.

This document is the implementation plan, not an instruction that the rollout has already happened. Application behavior, architecture refactoring, production infrastructure, and the deferred server-side AI proxy are outside this rollout. Complete the stages in order, using a small, reviewable change per stage. Creating this plan does not complete any stage.

## Observed baseline

- React/TypeScript/Vite application with feature modules, domain functions, shared UI/hooks, and service boundaries.
- No root `AGENTS.md`, `DESIGN.md`, or documentation directory existed before this plan.
- `README.md` describes the structure and setup but still references the removed root `utils.ts` facade and says formatting is not enforced in CI.
- `.github/workflows/ci.yml` already runs lint (including typecheck), formatting, unit tests, build, and desktop/mobile browser tests.
- `REFACTORING_IMPLEMENTATION_PLAN.md` combines a large completed checklist, historical verification, and a deferred server-side AI proxy decision. Reconcile its status before moving it; do not turn a deferred item into completed work.
- Patient persistence, attachment lifecycle, typed AI actions, and browser-side Gemini credentials need explicit documentation of current behavior and limitations.

These observations came from source inspection, not a fresh application test run.

## Proposed document ownership

- `README.md`: concise product introduction, quick start, and links into the documentation.
- `AGENTS.md`: repository-wide agent instructions, reading route, change workflow, verification expectations, and definition of done. Target 80–120 lines; link to detail.
- `DESIGN.md`: current architecture and UI design principles, dependency boundaries, core data flows, and important constraints. Target at most 250 lines before considering a focused extraction.
- `docs/README.md`: documentation index and a short guide to where information belongs. It is not a second copy of the documentation.
- `docs/development.md`: environment setup, configuration, commands, local troubleshooting, and contribution workflow.
- `docs/testing.md`: choosing checks by change type, test locations, browser/visual verification, and CI behavior.
- `docs/product.md`: supported user journeys and behavior across intake, charts, orders, notes, course, handoff, profile, settings, and chat; distinguish implemented behavior from intent.
- `docs/data-and-persistence.md`: shared data contracts, storage keys, hydration/migrations, import/export, attachments, and resource cleanup.
- `docs/ai-integration.md`: feature actions, gateway, task adapters, transport, prompts/schemas, error handling, test strategy, and credential limitations.
- `docs/operations.md`: build/preview/deployment facts, browser-data recovery limitations, troubleshooting, and unresolved production prerequisites. Do not invent deployment or backup infrastructure.
- `docs/work/README.md`: task lifecycle and a copyable task template.
- `docs/work/ongoing/`: planned, active, and blocked task records, one file per coherent deliverable.
- `docs/work/done/`: concise completed or explicitly cancelled/superseded task records, with final outcome stated accurately.
- `docs/decisions/`: add only when a consequential decision needs durable rationale that does not fit in `DESIGN.md`. No empty decision catalog or decision file for every edit.

Treat “complete documentation” as coverage of supported workflows, boundaries, setup, verification, operations, and known limitations. Do not document every function, reproduce types, or copy configuration values already available in source. Link to owning modules and representative tests.

## Stage 1 — Reconcile the existing knowledge

- [x] Inventory existing documentation, CI, scripts, configuration, feature boundaries, and outstanding refactoring items.
- [x] Check README claims against current files and commands; fix known drift.
- [x] Classify each durable fact as current behavior, historical evidence, accepted decision, or future work.
- [x] Identify the authoritative destination for each topic using the ownership list above.
- [x] Preserve the explicit deferral of the server-side AI proxy. Record remaining work without authorizing its implementation.

Completion gate: all existing documents have a destination, known contradictions are resolved, and remaining work has an explicit disposition. Verify documented script names against `package.json` and CI, rather than treating old test counts as current results.

## Stage 2 — Establish the agent contract and task lifecycle

- [x] Create root `AGENTS.md` with repository-wide scope; avoid duplicate tool-specific rule files.
- [x] Specify the reading order: `AGENTS.md`, relevant sections of `DESIGN.md`, `docs/README.md`, and the matching ongoing task. Agents should then read only the topic docs and source relevant to their task.
- [x] Require agents to inspect working-tree changes, respect unrelated work, identify the owning modules, and define the verification needed before editing.
- [x] Create `docs/work/README.md`, `ongoing/`, and `done/`. Both directories contain task records.
- [x] Adopt the task template and lifecycle below. Use this rollout record as the working task until closure.
- [x] Define completion to include relevant code/tests/docs, truthful verification evidence, unresolved risks, and an actionable handoff when work remains.

Completion gate: a fresh agent can determine where to start, which files to update, how to verify its work, and how to resume an interrupted task from the repository alone.

### Task template and lifecycle

Use a stable filename such as `2026-10-08-short-task-name.md`; preserve existing filenames when migrating records to avoid unnecessary link churn. Each record contains:

- Status: planned, active, blocked, done, cancelled, or superseded.
- Owner and last meaningful update date.
- Goal, scope, non-goals, and acceptance criteria.
- A short ordered checklist and relevant dependencies.
- Material decisions or links to durable decisions.
- Verification: commands/checks actually run, outcome, and any unverified limitations.
- Current blocker or exact next action while unfinished.
- Final outcome and follow-up links when closed.

Claim an existing relevant record before creating a new one. Use task records for multi-step work, behavior changes, migrations, or work that may need handoff. A typo or equally small isolated correction needs only the relevant document change and normal change summary; it does not need a ceremonial task file.

Move the same file from `ongoing/` to `done/` only after acceptance criteria and required checks pass and durable knowledge is incorporated into its owning documents. Blocked work stays in `ongoing/` with a reason and next action. Cancelled or superseded work may be archived with that explicit status and reason; never label it successfully completed. Repair inbound links when moving files. Do not keep copies in both directories or maintain a separate manual task-status index.

## Stage 3 — Document the architecture and design

- [x] Create `DESIGN.md` from the current implementation, clearly separating existing architecture from future proposals.
- [x] Explain ownership of the app shell, features, domain, shared UI/hooks, services, configuration, types, and utilities.
- [x] Describe the framework-independent domain, feature workflow, shared primitive, and AI adapter boundaries.
- [x] Trace patient persistence and feature action/gateway/AI response flows in prose.
- [x] Capture shared UI, accessibility, and responsive behavior expectations.
- [x] State persistence, attachment lifecycle, typed AI, and behavior-preservation invariants.
- [x] Link to focused documentation; keep historical rationale out of current architecture.

Completion gate: every major boundary and flow is supported by a current source reference; intended future architecture is never presented as implemented.

## Stage 4 — Complete focused documentation

- [x] Write development/testing, product, persistence, AI, and operations documents.
- [x] Cross-reference representative tests without copying tests or snapshots.
- [x] Explain the browser-side Gemini integration and preserve the deferred proxy decision.
- [x] Document setup without credentials or patient data.
- [x] Reduce `README.md` to an entry point and populate `docs/README.md`.
- [x] Compare documented commands and setup against package scripts and CI; live AI/deployment verification is not claimed.

Completion gate: a new contributor can set up the app, locate a workflow, identify its contracts, choose checks, and understand deployment/data limitations without consulting the old refactoring log.

## Stage 5 — Consolidate historical work

- [x] Reconcile the only unfinished item in `REFACTORING_IMPLEMENTATION_PLAN.md`: the explicitly deferred server-side AI proxy.
- [x] Track that proxy separately as blocked pending an approved implementation and deployment scope.
- [x] Move current architecture and credential constraints into their owning docs.
- [x] Replace the mixed-purpose plan with a concise completed-refactor record; detailed history remains in Git.
- [x] Repair references and remove the obsolete root plan.

Completion gate: no active item is lost, completed history is separate from current instructions, and there is one authoritative copy of each task and fact.

## Stage 6 — Add lightweight enforcement

- [x] Add a documentation checker and `npm run docs:check` for required docs, local Markdown links, and task status/location.
- [x] Keep it offline and simple; its self-test checks valid and invalid temporary fixtures.
- [x] Add the checker to the existing CI workflow without duplicate jobs.
- [x] Add a PR template covering behavior, validation, documentation impact, and the relevant task.
- [x] Verify detection of missing files, broken links, and misplaced status metadata.

Completion gate: CI catches objective documentation defects and the PR checklist prompts semantic review. Do not enforce a documentation edit for every code diff: meaningful accuracy cannot be reduced to a changed-file count.

## Stage 7 — Pilot and close the rollout

- [x] Use this documentation rollout as the pilot; no product change was needed.
- [x] Confirm this record contains enough scope, stages, and verification for a later session to understand the completed rollout.
- [x] Check owning docs for accuracy and record no application behavior change in this rollout.
- [x] Remove duplicate historical plan content and retain a single summary.
- [x] Run documentation checker and formatting validation.
- [x] Record results and move this record into `docs/work/done/`.

Completion gate: the repository supports discovery, implementation, verification, handoff, and closure without relying on chat history, duplicate instructions, or an accumulating execution diary.

## Continuous improvement without document sprawl

The implementing `AGENTS.md` should make these requirements explicit:

1. Assess documentation impact on every task. Update affected authoritative documents in the same change as the code. Record a brief reason in the task/PR summary when no durable documentation changes are needed; do not force unrelated edits.
2. Update active task state at meaningful milestones, blockers, handoffs, and completion. Replace outdated status and next steps instead of appending a transcript after every command.
3. Put architecture changes in `DESIGN.md`, operational/setup changes in their topic docs, and progress in the task record. A task log must never become the sole source of a current contract.
4. Improve guidance when evidence reveals an incorrect instruction, recurring failure, or reusable lesson. Prefer a concrete correction or automated regression check over adding a new blanket rule. Do not relax established safeguards merely to get a task passing.
5. Search for an existing home before adding a file. Split a document only when it serves a distinct reader need or has become difficult to navigate; treat size targets as review prompts, not reasons to scatter content.
6. Keep examples small, source links current, and history compact. Do not commit raw tool output, chat transcripts, repetitive check results, generated API inventories, or temporary reports as prose documentation.
7. Review nearby documentation for duplication and stale claims during relevant work. Keep cleanup bounded to the task; record material unrelated problems as follow-ups rather than expanding scope silently.
8. At closure, consolidate durable lessons, archive the task once, and leave only real unfinished work in `ongoing/`. Git records edit history; Markdown explains current truth, decisions, and next actions.

## Verification record

- Planning: inspected README, package scripts, CI, repository layout, persistence/attachment code, Vite configuration, and the existing refactoring plan.
- `npm run docs:check`: passed its valid/invalid fixture self-tests and the repository checks for required paths, Markdown links, and task status/location.
- `npm run format:check`: passed after formatting the new documentation and checker.
- Application tests: not run; this rollout changed repository guidance and documentation, not application behavior.
- Pilot: used this rollout task record through its ongoing-to-done transition and verified its recorded scope, stages, and outcome provide a self-contained handoff.
