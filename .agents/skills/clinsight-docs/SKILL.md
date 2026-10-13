---
name: clinsight-docs
description: Create, update, or reconcile Clinsight repository documentation with implementation. Use for documentation requests or durable documentation changes accompanying a task; task progress belongs in the existing tracker.
---

# Clinsight Documentation

## Find the authoritative home

Read `AGENTS.md` and `docs/README.md`, then inspect the requested change, affected code/tests, and relevant tracker. Paths here are repository-relative. Use the existing ownership map:

- Product behavior: `docs/product.md`; presentation and interaction conventions: `docs/design-system.md`.
- Module ownership and flows: `docs/architecture.md`.
- Persisted contracts, migrations, attachments, import/export: `docs/data-and-persistence.md`.
- Typed AI actions, gateway/tasks/transport, credential limitations: `docs/ai-integration.md`.
- Setup and commands: `docs/development.md`; check selection and test constraints: `docs/testing.md`; deployment and recovery limits: `docs/operations.md`.
- Cross-cutting agent invariants: `AGENTS.md`; navigation: `DESIGN.md`, `README.md`, and `docs/README.md`; progress and evidence: the task record under `docs/work/`.

## Reconcile facts

Trace each material statement to implementation, configuration, tests, or an explicit decision. When code and docs disagree, identify whether the code violates the intended contract or the document is stale; do not silently redefine intended behavior to match a bug. Clearly separate implemented, planned, and deferred capabilities.

Replace stale statements in their owning section. Link to the authoritative explanation instead of copying it. Preserve clinical terminology, units, original text, and meaningful formatting in examples. Use synthetic examples and exclude patient content, secrets, raw AI payloads, and sensitive captures.

Keep the browser credential exposure, local-only storage limitations, and deferred proxy accurate. Do not imply that a gateway is a server, that a build establishes clinical correctness, or that ownership conventions have automated enforcement.

## Verify and deliver

Check referenced paths, scripts, and affected cross-links. Follow `docs/work/README.md` when updating or moving a tracker; retain one record and repair incoming links. Record actual checks rather than a command diary.

Run `npm run docs:check` and `npm run format:check`; format only touched files when correcting formatting. If code/configuration also changed, select additional checks from `docs/testing.md`.

Deliver the documents changed, material facts reconciled, check results, and any unresolved discrepancy. If inspection establishes that no durable documentation update is needed, state why instead of manufacturing a new page.
