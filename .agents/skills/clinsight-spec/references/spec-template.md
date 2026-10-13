# Agent-ready specification template

Use this structure inside the canonical work record. Replace instructional text with task-specific facts; preserve the lifecycle fields from `docs/work/README.md`. Paths below refer to the repository root. Scale optional design details to the task rather than filling them with generic prose.

```markdown
# Feature or task title

Status: planned
Owner: unassigned
Updated: YYYY-MM-DD

## Goal

State the user problem, affected workflow, and observable outcome.
State whether this record tracks specification delivery or feature implementation.

## Scope

- Included workflows, users, and changes.

## Non-goals

- Excluded behavior, infrastructure, and adjacent work.

## Context and evidence

- Current behavior and relevant implementation/test/document paths.
- Requested behavior and why the change is needed.
- Constraints, assumptions, and explicit decisions already made.

## Requirements

- R1: Observable behavior with inputs, outputs, and boundary conditions.
- R2: Error/empty/cancellation behavior and review/edit expectations as relevant.

## Acceptance criteria

- [ ] AC1 (R1): Given a concrete starting state, when an action occurs, then an observable result follows.
- [ ] AC2 (R2): A relevant failure or compatibility case preserves the required behavior.

## Proposed design

- Owning feature/module and affected boundaries; existing patterns to reuse.
- State transitions, identity and lifecycle, UI/accessibility/responsive behavior.
- Data shapes, legacy hydration, stable IDs, attachments, import/export impact.
- AI input/result contracts, review requirements, errors, and offline test seams.
- Source/clinical meaning preservation and sensitive-data handling.
- Relevant performance constraints and how to measure them.
- Alternatives considered and rationale for the smallest coherent solution.
- Mark irrelevant dimensions explicitly with a brief reason.

## Implementation plan

1. Work item: requirement IDs, likely files/owners, dependencies, change, verification, and exit condition.
2. Subsequent item: same fields, ordered by dependency.

## Verification plan

- For each AC: test or inspection, expected observable evidence, and relevant test path.
- Required repository commands selected from docs/testing.md.
- Synthetic fixtures, browser scenarios, and manual checks where needed.
- Explicit limitations: what these checks cannot establish.

## Risks and recovery

- Concrete failure risks and mitigation.
- Reversal or recovery approach; distinguish code rollback from data recovery.

## Decisions and open questions

- Decision, rationale, and evidence/source.
- Unresolved question, blocking impact, and who/input can resolve it.
- Readiness: ready, or blocked by named decisions.

## Documentation impact

- Owning documents to update, or reason no durable change is needed.

## Progress

- Current state and next concrete action; record a blocker when applicable.

## Verification

- Actual commands, results, revision/scope, and outstanding checks.
- At planning time: not run; verification above is a plan.

## Outcome

- On closure: delivered scope, acceptance evidence, limitations, and follow-ups.
- Do not describe implementation as complete when only the spec was delivered.
```
