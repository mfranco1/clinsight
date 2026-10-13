---
name: clinsight-spec
description: Create or revise an agent-ready Clinsight feature spec or implementation plan. Use for requirements, acceptance criteria, technical design, and task breakdown before implementation; planning alone does not authorize implementation.
---

# Clinsight Spec and Plan

## Establish the contract

Read `AGENTS.md`, applicable directory guidance, `docs/work/README.md`, and the relevant ongoing tracker. Inspect the affected implementation and tests before proposing file locations or behavior. Read `docs/architecture.md` for ownership and the relevant product, data, AI, or design-system document. Paths in this skill are repository-relative unless linked otherwise.

Translate the request into a concrete user problem, observable outcome, scope, and non-goals. Distinguish existing behavior, requested behavior, assumptions, and unresolved decisions. Ask only about gaps that materially change scope, clinical meaning, compatibility, or acceptance; continue independent planning. Never invent clinical rules to fill a product gap.

## Write the specification

Use [the spec template](references/spec-template.md) to extend the existing task record, or create `docs/work/ongoing/YYYY-MM-DD-short-name.md` following the repository lifecycle. Keep one canonical record rather than a competing plan and tracker. Scale detail to the change; retain required lifecycle fields and mark irrelevant design sections with a brief reason.

Give requirements stable IDs and measurable acceptance criteria. Map each requirement to implementation work and verification. Specify normal, empty, malformed, failed, cancelled, and identity-switch behavior where relevant. Preserve clinician review and source provenance. For data changes, spell out legacy hydration, stable associations, attachment serialization, and import/export compatibility. For AI changes, specify typed inputs/results and error behavior at the gateway seam, using synthetic offline tests.

Break work into dependency-ordered, independently verifiable steps. Name likely module owners and existing patterns, expected tests, documentation updates, and completion evidence. Do not prescribe speculative abstractions or backend work; the server proxy remains deferred unless explicitly requested.

## Readiness and handoff

Check that an implementing agent can start without rediscovering the goal or choosing an unresolved product policy. Mark readiness as ready or blocked by named decisions, separate from lifecycle status. A ready spec may remain planned while implementation has not started. If the request is only to produce a spec, completion means the spec deliverable, not the feature, is done; make that distinction explicit in the record.

Run `npm run docs:check` and `npm run format:check` after saving. Deliver the canonical path, readiness, key assumptions, unresolved decisions, and first implementation action. Do not claim planned tests have run.
