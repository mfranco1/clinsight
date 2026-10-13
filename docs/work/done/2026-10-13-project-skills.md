# Clinsight project skills

Status: done
Owner: Codex
Updated: 2026-10-13

## Goal

Provide six reusable repository skills for planning, documentation, completion auditing, code review, architecture review, and maintenance.

## Scope

- Project skills with distinct triggers, Clinsight-specific workflows, and UI metadata.
- An agent-ready spec template and documentation of skill usage.

## Non-goals

- Application changes, backend infrastructure, and global skill installation.

## Acceptance criteria

- [x] Six valid skills cover the requested workflows without conflicting with repository invariants.
- [x] The spec template connects requirements, acceptance, implementation steps, and verification.
- [x] Documentation explains invocation and workflow boundaries.
- [x] Skill validation, documentation checks, and formatting pass.

## Progress

Six project skills and the spec template are complete. Usage and workflow boundaries are documented in `docs/development.md`. No next action is required for this deliverable.

## Decisions

Use repository-local `.agents/skills/` with normal automatic discovery and explicit invocation. Reviews remain reviews unless fixes are requested; planning does not imply implementation authorization.

## Verification

- YAML/frontmatter, skill naming, body length, scaffold absence, and UI metadata checks passed for all six skills using the repository's installed Node YAML parser.
- The bundled Python `quick_validate.py` was attempted but could not load PyYAML in either available Python runtime; equivalent structural checks were run with the installed parser instead.
- `npm run docs:check` passed, including checker self-tests and local links within the skills.
- `npm run format:check` passed.
- `git diff --check` passed.
- Manually reviewed routing for spec-only delivery, documentation reconciliation, acceptance audit with missing evidence, diff-only review, architecture-only review, and maintenance with dynamic consumers. Instructions retain their distinct scopes and prevent unsupported completion claims.
- No application code or build configuration changed, so application tests/build were not required. Fresh-session automatic skill selection and end-to-end agent execution were not tested.

## Outcome

Delivered all six requested workflows as repository-local skills with normal discovery metadata and explicit invocation names. The spec template connects requirements to acceptance, implementation, and verification. Durable usage guidance lives in the development document; application and clinical behavior are unchanged.
