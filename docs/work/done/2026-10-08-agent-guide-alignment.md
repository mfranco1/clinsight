# Agent guide and documentation alignment

Status: done
Owner: Codex
Updated: 2026-10-08

## Goal

Adapt the supplied Project/Stack/Invariants/Guidance/Documentation/Verification/Scope guide format to ClinSight and align documentation ownership with it.

## Scope

- Rewrite the root guide around clinical meaning, source context, runtime AI, stable IDs, persistence, and browser lifecycle invariants.
- Separate architecture and UI conventions into focused docs, retaining `DESIGN.md` as an entry point.
- Update navigation and required-document checks.

## Acceptance criteria

- [x] Guide matches the requested structure and reflects ClinSight's implementation.
- [x] Architecture and design guidance have authoritative homes without duplicated details.
- [x] Documentation and formatting checks pass.

## Progress

Completed the guide and documentation split. The repository documentation checker requires both new topic documents.

## Verification

- `npm run docs:check`: passed checker self-tests, required-document validation, task status/location, and local links.
- `npm run format:check`: passed.
- `git diff --check`: passed.

## Outcome

The guide follows the supplied section structure with ClinSight-specific invariants. `docs/architecture.md` owns architecture detail, `docs/design-system.md` owns UI conventions, and `DESIGN.md` links to the authoritative documents. Application code was not changed.
