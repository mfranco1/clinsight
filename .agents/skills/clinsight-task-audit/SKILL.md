---
name: clinsight-task-audit
description: Audit whether a Clinsight task, feature, or handoff is complete and meets its agreed scope. Use for completion checks, acceptance audits, and quality gates; focused defect review belongs to code review.
---

# Clinsight Task Audit

## Establish the audit baseline

Read `AGENTS.md`, `docs/work/README.md`, `docs/testing.md`, the original request/spec, relevant tracker, and current diff. Identify the exact revision and any uncommitted files covered. Separate inherited issues from this task. If scope is ambiguous, state the examined scope and resolve ambiguities before issuing a completion verdict. Paths here are repository-relative.

An audit request authorizes inspection and relevant verification; it does not itself authorize product changes. If fixes are already requested, complete them within scope and audit the resulting state. Never weaken acceptance criteria to make the task pass.

## Trace completion to evidence

For each acceptance criterion, record its ID/text, implementation evidence, test or inspection evidence, and status: met, unmet, or unverified. Inspect code and tests rather than trusting checked boxes or a prior summary. Identify requirements missing from the tracker and reconcile them against the request.

Check applicable clinical/source preservation, stable IDs, legacy data and attachment round trips, clinician review of AI results, resource cleanup, keyboard/accessibility, and responsive workflow behavior. Use the relevant owning docs to evaluate these; do not broaden a small task into an unrelated repository audit.

Inspect whether tests exercise the claimed outcome and failure paths. Select checks from `docs/testing.md`; application/build changes require typecheck and build, documentation changes require docs and format checks. Persistence and AI contract changes require their focused tests. Keep provider tests offline and synthetic. Existing valid evidence may be reused only when its revision, command, and relevance are clear; label it as previously recorded.

## Verdict and closure

Report completion as complete, incomplete, or blocked/unverified, with the acceptance evidence and ranked gaps. Include actual commands/results, skipped checks and reasons, remaining risk, and the next concrete action. A missing required check prevents a complete verdict; a build alone does not prove workflows or clinical correctness.

Keep detailed evidence in the existing tracker when record updates are within the requested scope; otherwise provide proposed corrections. Follow the lifecycle before moving a completed record to `docs/work/done/`. Separate completion of the audit from completion of the audited task. Record durable lessons in their owning documentation, not an appended audit diary.
