---
name: clinsight-maintenance
description: Perform scoped Clinsight refactoring, restructuring, dead-code cleanup, or dependency and repository maintenance. Use for implementation of maintenance work; review-only requests should remain reviews.
---

# Clinsight Refactoring and Maintenance

## Define the preservation boundary

Read `AGENTS.md`, `docs/architecture.md`, `docs/testing.md`, and the relevant tracker and contract documents. Inspect status, affected code/tests, and consumers before editing. Paths here are repository-relative. Follow `docs/work/README.md` for multi-step work and preserve unrelated changes.

State the concrete maintenance problem and observable improvement. Separate structural changes from intentional behavior changes. Capture behavior that must remain stable: clinical/source text, IDs and associations, persisted keys and shapes, attachments, typed AI results, draft/save/cancel behavior, keyboard access, and resource ownership as applicable. Do not expand cleanup into backend implementation.

## Make the smallest coherent change

Move logic to the documented owner rather than creating a new layer by default. Update callers, tests, imports, and documentation together. Avoid compatibility barrels unless a real migration needs them and their removal path is recorded.

Before deletion, search static and dynamic consumers, lazy imports, configuration, public assets, test discovery, and documented entry points. Treat `npm run check:dead-code` as evidence to investigate, not permission to delete every reported item. Never clear browser storage or remove user data to make compatibility tests pass.

For dependency changes, inspect the dependency's actual usage, supported APIs, Node/toolchain requirements, and relevant release guidance. Keep `package.json` and the lockfile consistent. Avoid blanket major upgrades or force-fixing audit output; scope changes to the maintenance problem and document remaining issues.

Use small reversible steps. Preserve prompt semantics and parsing behavior during AI refactors. For persistence changes, design explicit compatibility handling and legacy/round-trip fixtures before altering contracts. Add characterization coverage when an important behavior lacks protection; avoid tests that merely assert the new file arrangement.

## Validate and close

Run at least `npm run typecheck` and `npm run build` for application/build changes, then focused tests and other checks selected from `docs/testing.md`. Use the broad validation set there for broad restructuring. Run docs and format checks when documentation changes. Inspect affected desktop/mobile workflows for interaction changes; use only synthetic offline AI tests. Check bundle sizes when changing lazy loading or build boundaries.

Review the final diff for accidental clinical text changes, stale imports, lost files, unrelated edits, and misleading compatibility claims. Update authoritative docs when ownership or behavior changes; otherwise record why no durable update was needed. Close the tracker only when acceptance criteria and required checks pass. Deliver what changed, what behavior was preserved, actual verification, and remaining limitations.
