---
name: clinsight-code-review
description: Review Clinsight code changes or a pull request for concrete bugs, regressions, safety, and test gaps. Use for code or diff review; task acceptance and broad architecture evaluation are separate workflows.
---

# Clinsight Code Review

## Bound the review

Read `AGENTS.md`, applicable directory instructions, the request/tracker, and `docs/testing.md`. Inspect working-tree status and establish the requested base/head or local diff without altering unrelated work. Read surrounding implementations, callers, and tests. Paths here are repository-relative.

Default to findings only for a review-only request. If the user has requested fixes, preserve that authorization and review the final changes. Do not publish comments, merge, or deploy merely because a review was requested.

## Follow changed behavior

Use `docs/architecture.md` and relevant contract documents to trace affected flows. Prioritize evidence of:

- Changed clinical text, numbers, units, formatting, raw source, or grounding references during parsing/rendering/editing.
- Lost patient/encounter associations, regenerated IDs, destructive hydration, missing attachment bytes, broken reload/import/export, or swallowed storage failures.
- Unvalidated provider results treated as truth, bypassed clinician review, SDK leakage into features, missing cancellation/error handling, or sensitive diagnostics.
- Stale asynchronous results applied to another patient/entry, state retained across identity changes, save/cancel regressions, or unowned streams, URLs, listeners, and timers.
- Unsafe rich-content rendering, broken keyboard/accessibility behavior, or desktop/mobile workflow regressions.

Follow reachable execution paths and consumers before claiming a bug. Check that tests protect the intended contract rather than merely mirroring the implementation. Use synthetic data and offline mocks. Run focused checks where they resolve uncertainty; distinguish inspected, reproduced, and unverified behavior.

## Report actionable findings

Lead with findings ordered by severity. Each finding needs a short title, precise file/line location, triggering conditions, user or data impact, evidence, and a focused correction direction. Use P0 for immediate critical failures, P1 for high-impact defects needing prompt correction, P2 for normal actionable defects, and P3 for minor concrete problems. Reserve speculative concerns for labeled questions; omit taste-based rewrites and linter noise.

For a diff review, distinguish introduced regressions from pre-existing issues. If no actionable defects are found, say so and state coverage and residual verification gaps. Do not imply that an absence of findings proves clinical correctness or task completion. End with actual checks and limitations. Keep review output local unless external publication is explicitly authorized.
