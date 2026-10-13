---
name: clinsight-architecture-review
description: Review a Clinsight design or implementation for architectural fit, dependency direction, data ownership, and maintainability. Use for architecture assessments and design tradeoffs, not routine line-level code review or automatic restructuring.
---

# Clinsight Architecture Review

## Map the relevant system

Read `AGENTS.md`, `docs/architecture.md`, the task/spec, and relevant product, data/persistence, AI, and operational docs. Paths here are repository-relative. Trace actual imports, state owners, entry points, and calls in the affected subsystem; distinguish implemented flows from proposed designs.

Assess the documented dependency direction: application composition to features to domain/services/shared UI. Domain rules remain independent of React/browser UI; shared controls stay generic; feature workflows own their state and decisions; persistence and provider details stay behind existing boundaries. These are conventions, not proof of automated enforcement.

## Evaluate concrete tradeoffs

Examine only dimensions material to the request:

- State ownership, patient/encounter identity, draft lifetime, navigation retention, and disposal of browser resources.
- Durable versus runtime data, migration/import boundaries, attachment serialization, failure recovery, and preservation of source material.
- Typed AI actions/gateway/task/transport responsibilities, lazy loading, cancellation, errors, and clinician review.
- Feature coupling, dependency cycles, shared-control leakage, test seams, and whether an abstraction has real consumers.
- Performance and bundle effects supported by measurements or a named measurement plan.

Keep today's local browser persistence and Gemini integration explicit. Future server suitability means preserving useful seams; it is not authorization to build backend infrastructure or claim private credentials are protected. Do not recommend a rewrite solely to impose a preferred pattern.

For each material concern, cite affected paths and an observed consequence or plausible concrete change scenario. Compare the smallest coherent option against retaining the current design and any credible alternative. Separate required corrections, optional improvements, and deferred work.

## Deliver a decision-ready review

Provide scope, current/proposed flow, strengths worth preserving, prioritized findings, and recommended decisions with rationale and tradeoffs. For significant recommendations, include migration sequence, compatibility strategy, rollback/recovery limits, tests, and owning documentation updates. Label assumptions and unresolved decisions.

A review-only request ends with recommendations, not restructuring. If implementation is authorized, apply only the agreed scope and validate using `docs/testing.md`. Record durable accepted decisions in `docs/architecture.md` or the appropriate contract document, and execution progress in the task tracker. Do not claim correctness from a diagram or structural inspection alone.
