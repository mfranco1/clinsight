# AGENTS.md

## Project

Clinsight is a browser-based clinical documentation application for patient intake, charts, orders, notes, handoffs, and AI-assisted workflows.

The current application stores patient data locally in the browser and calls Gemini at runtime. Keep its boundaries suitable for a future server integration while preserving current behavior and compatibility.

## Stack

- React and TypeScript
- Vite
- Tailwind CSS, shared UI components, and Motion
- localStorage for current persistence
- Gemini through typed AI actions and a gateway
- Vitest, Testing Library, and Playwright

Do not add backend infrastructure unless explicitly requested. The server-side AI proxy remains deferred; see [AI integration](docs/ai-integration.md).

## Core Invariants

### 1. Preserve clinical meaning and source context

Never silently change clinical facts, numbers, units, medical terminology, or meaningful formatting during refactoring, parsing, import/export, or presentation changes.

Preserve original notes, raw text, and grounding references where the data contract provides them. Keep source material distinguishable from generated or edited content. Make intentional clinical-content changes through the relevant workflow or an explicitly scoped change, with their rationale recorded.

### 2. AI assists clinician review

Runtime AI is part of this product. Preserve typed task inputs/results and existing review/edit workflows. Generated content requires clinician review; do not treat provider output as validated clinical truth.

Keep provider-specific handling behind the AI gateway/task/transport boundary. Never commit credentials, real patient data, raw clinical prompts/responses, or sensitive screenshots to code, tests, docs, or trackers. The current browser integration exposes its configured key; use development-only credentials until a server integration is implemented.

### 3. Preserve persistence compatibility and stable IDs

Patient, encounter, entry, note, and order identifiers must remain stable once established. Do not regenerate them casually; deliberate creation, import normalization, and migration behavior must preserve associations.

Keep persisted records backward-compatible. Cover legacy hydration and import/export round trips when changing data shapes. Serialize attachment bytes and metadata; runtime `File` objects and blob URLs are not durable storage values.

### 4. Separate concerns

Keep domain rules independent from React UI. Keep feature workflows in their owning modules and shared controls generic. Route persistence through existing storage/persistence abstractions rather than scattering direct localStorage access. Keep provider details out of feature UI.

### 5. Own browser resources and preserve interaction

Release media streams, object URLs, listeners, and timers when their owner is removed or unmounted. Preserve accessible names, keyboard behavior, responsive layouts, and existing patient workflows unless the task intentionally changes them.

## Repository Guidance

Before making significant changes:

1. Inspect the implementation, tests, and working tree; preserve unrelated changes.
2. Read relevant documentation and the task tracker being continued.
3. Reuse existing patterns where appropriate.
4. Make the smallest coherent change and update its relevant documentation.
5. Run applicable validation, tests, and build checks.

Do not rewrite working code solely to impose a preferred architecture. Follow [repository ownership and dependency boundaries](docs/architecture.md#repository-ownership) when placing or importing modules. These are documented conventions; do not claim they are automatically enforced by a dependency checker.

## Documentation

Use repository documentation as the source of truth for details:

- [DESIGN.md](DESIGN.md) — design entry point
- [docs/architecture.md](docs/architecture.md) — ownership, boundaries, and data flows
- [docs/product.md](docs/product.md) — implemented workflows and UX expectations
- [docs/data-and-persistence.md](docs/data-and-persistence.md) — data contracts, migrations, attachments, and import/export
- [docs/ai-integration.md](docs/ai-integration.md) — runtime AI contracts and credential limitations
- [docs/design-system.md](docs/design-system.md) — visual design and UI conventions
- [docs/development.md](docs/development.md) — setup and commands
- [docs/testing.md](docs/testing.md) — verification strategy
- [docs/operations.md](docs/operations.md) — operational constraints

Update the authoritative document in the same change when its facts change. Improve guidance when evidence reveals a stale instruction or recurring problem. Search for an existing home before adding a file; replace stale text instead of appending duplicate rules or execution diaries. When no durable documentation changes are needed, state a brief reason in the task or change summary.

### Progress Tracking

Use Markdown trackers for multi-step work or work that may need a handoff:

- `docs/work/ongoing/` — create planned/active/blocked trackers here.
- `docs/work/done/` — move the same tracker here after completion; cancelled/superseded work must state its actual outcome.

Follow [the task lifecycle and template](docs/work/README.md). Keep scope, acceptance criteria, status, next action, and actual verification current at meaningful milestones. Incorporate durable lessons into their owning docs before closing the tracker. Tiny isolated edits need no new tracker.

## Verification

Run relevant project checks; see [testing](docs/testing.md). At minimum, ensure `npm run typecheck` and `npm run build` succeed when changing application code or build configuration. For documentation changes, run `npm run docs:check` and `npm run format:check`. For persistence or AI contract changes, run the relevant migration/round-trip or task/transport tests.

Do not claim completion while relevant checks fail. Report checks actually run and any unverified limitations; a build does not verify live AI, deployment, or clinical correctness.

## Scope

More-specific `AGENTS.md` files may add or override guidance for their directory. Prefer repository invariants and documented source-of-truth files over duplicating detailed implementation instructions here.
