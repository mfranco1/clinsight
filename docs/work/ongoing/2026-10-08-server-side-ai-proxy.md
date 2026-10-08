# Server-side AI proxy

Status: blocked
Owner: unassigned
Updated: 2026-10-08

## Goal

Move provider calls and private credentials out of browser-delivered code before using private or production credentials.

## Scope

- Design and implement an appropriately deployed server-side integration, after its product/security/deployment requirements are approved.
- Preserve the typed `ClinicalAiGateway` feature contract where suitable.

## Non-goals

- This is explicitly deferred by the decision recorded in the completed [refactoring record](../done/2026-10-08-behavior-preserving-refactor.md).
- This documentation rollout does not authorize implementation or choose hosting, authentication, or data-retention policy.

## Acceptance criteria

- [ ] A separately approved implementation scope and deployment design exist.
- [ ] Provider credentials are never shipped to browser code.
- [ ] Applicable request validation, access control, privacy, error handling, and operational checks are defined and verified.

## Progress

The current Vite build injects `GEMINI_API_KEY` into browser code. Keep this limitation visible in [AI integration](../../ai-integration.md). The proxy was explicitly deferred pending an approved implementation and deployment scope. Next action: revisit only when that scope is authorized.

## Verification

Not started; implementation remains deferred.
