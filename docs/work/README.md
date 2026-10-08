# Work tracking

Use a task record for multi-step work, behavior changes, migrations, or work likely to need a handoff. A tiny isolated edit can be summarized in its change description without creating a task file.

## Lifecycle

- `planned`, `active`, or `blocked` records live in `ongoing/`.
- `done` records live in `done/` only after acceptance criteria and required checks pass.
- `cancelled` or `superseded` records may move to `done/` for history, but must state the reason and must not claim successful completion.
- Move the same file; do not keep copies or create a second manual status index. Repair links that refer to its old path.
- Claim/update a relevant task before starting similar work. Keep its current status, blocker/next action, and verification evidence accurate at meaningful milestones. Replace stale state; do not append a command diary.
- Put durable architecture, setup, product, data, and AI facts in their owning document. Task records hold scope, progress, evidence, and outcome.
- When a task closes, incorporate durable knowledge, record actual verification, and remove it from `ongoing/`.

Use `YYYY-MM-DD-short-name.md` for new records. Avoid renaming existing records just for convention.

## Template

```markdown
# Task title

Status: planned
Owner: unassigned
Updated: YYYY-MM-DD

## Goal

One concrete outcome.

## Scope

- Included work.

## Non-goals

- Explicit exclusions or dependencies.

## Acceptance criteria

- [ ] Observable completion condition.

## Progress

- Current state and next action.

## Decisions

- Material decision or link; omit if none.

## Verification

- Not run yet.

## Outcome

Complete when closed; include final result and follow-up links.
```
