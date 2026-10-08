# Application consistency and cleanup refactor

Status: done
Owner: unassigned
Updated: 2026-10-08

## Goal

Remove verified dead code, consolidate repeated behavior into composable primitives, establish one application-wide design system, and clarify module ownership without changing clinical meaning, persisted records, or existing workflows. All tests must be offline with respect to AI providers.

## Scope

- Application source, styles, dependencies, tests, build/test configuration, and relevant documentation.
- Incremental refactoring of all product surfaces, including access pages, patient workflows, shared dialogs, print, and clipboard output.
- Reuse the boundaries established by the [previous refactor](../done/2026-10-08-behavior-preserving-refactor.md).

## Non-goals

- No backend, server AI proxy, framework replacement, feature additions, clinical content revision, or persistence format redesign.
- No live Gemini or other AI-provider calls during unit, component, browser, visual, manual verification, or CI tests. No live-call smoke test exception.
- No wholesale dependency upgrades or abstractions added solely to reduce line counts.

## Findings informing the plan

- The working tree was clean before this planning change. Existing feature/domain/service boundaries and strict TypeScript provide a useful foundation.
- `styles.css` has global styling but no semantic theme tokens. Components repeat palette, spacing, border, and interaction classes.
- `ModalShell`, `PortalMenu`, `StatusDropdown`, `IconButton`, file controls, and media hooks already provide reusable foundations. The two typed status dropdown adapters already share `StatusDropdown`; retain their distinct domain semantics.
- `components/ui/modals/` contains clinical workflows such as prescription generation and home instructions. `ClinicalMarkdown` and `ClinicalChatInput` are domain-aware despite living under generic UI.
- `components/soap/SectionCard.tsx` is used beyond charting. `components/soap/utils.tsx` supports several features and `ClinicalMarkdown`; it is not an unused legacy file or an independently replaceable renderer.
- `App.tsx`, `SoapView.tsx`, `InputSection.tsx`, and `OrdersView.tsx` remain large coordination/presentation modules. Size identifies review candidates, not proof that code is redundant.
- Existing AI tests mock selected gateways/actions/transports. `tests/setup.ts` has no global network guard. Playwright has no shared network policy and can reuse an existing server; its build uses Vite configuration that loads a Gemini key.
- Knip 6.40.0 now runs through `npm run check:dead-code`; after manual disposition of its findings, it reports no unused files, exports, or dependencies. The initial report identified two unused modules, duplicate default/named component exports, private helpers unnecessarily exported, and a redundant notification facade. Existing typed UI/domain contracts used internally were retained.

## Decisions

### Design system

Build a ClinSight design system on the existing Tailwind foundation, using the focused **Radix Dialog and Select primitives** for complex accessible interactions and local typed wrappers for appearance and composition. Retain Lucide and Motion where already useful. Radix is an unstyled foundation, so tokens, component variants, usage guidance, and application migration are required to make this a complete design system.

This recommendation fits the current custom clinical layouts without replacing the visual language. Radix documents keyboard and focus behavior in its [accessibility guidance](https://www.radix-ui.com/primitives/docs/overview/accessibility). Verify actual integration rather than assuming a library makes the application accessible. Native controls remain appropriate for simple inputs and buttons.

Evaluate one dialog and one status selector in Stage 4 before wider adoption. Confirm supported React/package versions, license, bundle impact, portal behavior, and Motion compatibility at implementation time. Use one interaction foundation consistently; do not introduce a second overlapping component suite. Shadcn/ui is a viable source-owned alternative, but adding it alongside custom Radix wrappers would introduce an unnecessary second convention.

### Directory structure

Use a conventional `src/` application boundary while retaining the documented feature-first architecture. This is a project-specific engineering choice, not a claim that a universal latest folder standard exists. React's [component hierarchy guidance](https://react.dev/learn/thinking-in-react) supports responsibility-based composition; it does not prescribe directory names.

Proposed destination structure:

```text
src/
  index.tsx
  App.tsx              # root application composition
  app/
    shell/
  features/
    <workflow>/
      <Workflow>View.tsx
      components/         # when needed
      hooks/              # when enough hooks justify grouping
      selectors.ts        # only where needed
  components/
    ui/                   # generic, domain-independent primitives
    clinical/             # genuinely shared clinical presentation
    dialogs/              # genuinely shared domain-aware dialogs
  domain/                 # pure rules, factories, transitions
  services/
    ai/                   # existing actions/gateway/tasks/transport
  hooks/                  # reusable browser and React lifecycles
  config/
  utils/                  # focused, explicitly named helpers
  styles/
    tokens.css
    globals.css
  types.ts                # preserve shared contracts initially
tests/
  fixtures/
  e2e/
scripts/
docs/
```

Keep build configs, `index.html`, package files, and static assets at their appropriate repository locations. Do not create empty scaffolding. Keep centralized tests initially to avoid coupling test relocation to source moves. Split `types.ts` only when ownership and cycle analysis justify it; preserve IDs and serialized contracts.

## Staged implementation

Execute in order. Each stage may be several small reviewable changes; do not mix mechanical moves with behavior changes. Stop on a failed gate, repair it, and record evidence before continuing.

### Stage 1 — Enforce offline AI tests and establish a baseline

1. Add a default-deny network policy to the unit test setup, covering the actual SDK transport and browser/Node request APIs used by tests. Unexpected unmocked requests must fail the test even if application code catches the resulting error.
2. Preserve focused gateway, action, task, and transport tests with deterministic synthetic responses. Mock the SDK boundary for transport-request tests; keep real parsing and request mapping under test.
3. Add a shared Playwright fixture that permits only the local app origin, fulfills explicitly mocked requests locally, blocks external HTTP and WebSocket traffic, and fails on unexpected attempted traffic. Block service workers to prevent interception gaps. Stub external font assets locally where necessary for stable screenshots.
4. Use an isolated test build with a fixed dummy key and deterministic fake gateway. Ensure the test build cannot read real credentials from local environment files, cannot fall back to the real gateway, and does not reuse a development server. Keep the fake gateway out of normal runtime builds.
5. Exercise success, empty/malformed responses, provider failure, cancellation, and retry using fixtures. Add an intentional blocked-request test proving no request leaves the process/browser. Record blocked attempts without request bodies, keys, or clinical text.
6. Only after these safeguards work, run the existing baseline checks and capture synthetic desktop/mobile workflow baselines. Update `docs/testing.md` and `docs/ai-integration.md` with the mandatory policy.

**Gate:** The guard self-check and mocked AI tests pass; normal tests have zero unexpected external attempts. Existing failures are identified and resolved before structural changes. Playwright's [network documentation](https://playwright.dev/docs/network) describes local request fulfillment and interception caveats.

### Stage 2 — Audit and remove proven dead code

1. Inventory runtime/build/test entry points, dynamic imports, public assets, CSS references, scripts, exports, and dependencies. Use a configured static analyzer such as [Knip](https://knip.dev/overview/getting-started) plus reference searches and manual verification.
2. Record each candidate, evidence of no consumer, relevant entry points checked, and disposition in this tracker. Distinguish unused exports from unused modules and externally referenced assets.
3. Delete confirmed dead files, exports, unreachable branches, obsolete comments, styles, and dependencies in small groups. Update the lockfile for dependency removals. Do not remove migrations, fixtures, or reference documents merely because production code does not import them.
4. Inventory repeated behavior and markup across the application for Stages 4–6. Record candidate consumers and the shared contract before extracting anything.

**Gate:** No unexplained analyzer findings; exceptions have concrete reasons. Typecheck, build, relevant tests, and affected browser journeys pass. No dangling asset/document links. Do not claim zero dead code solely from a clean analyzer report.

### Stage 3 — Normalize source placement and ownership

1. Move runtime code beneath `src/` mechanically; keep composition at `src/App.tsx` and shell modules at `src/app/shell/`. Update the HTML entry point, Vite/Vitest/TypeScript aliases, test imports, lint/analyzer configuration, and documentation references together.
2. Move dashboard-only presentation such as `TodayTasksSidebar` to its feature. Place prescription/home-instruction dialogs with their verified owner; shared clinical dialogs belong under `components/dialogs/`, not generic UI.
3. Move shared clinical rendering/composition under `components/clinical/`. Keep the existing formatting implementation intact during relocation. Separate the generic section container from SOAP-specific naming.
4. Review imports for cycles and ownership violations. Generic UI must not import clinical types, feature modules, persistence, or AI. Domain must not import React or browser services. Keep provider imports behind `services/ai/`.
5. Add narrowly scoped lint import restrictions where practical, with accurate documentation of what they enforce. Avoid permanent compatibility barrels; migrate all callers in the same slice.

**Gate:** Mechanical moves preserve behavior; import checks, typecheck, build, full unit suite, and existing E2E pass. Update `docs/architecture.md` and `docs/development.md` to reflect actual paths and enforcement.

### Stage 4 — Establish tokens and composable UI foundations

1. Define semantic tokens for surfaces, text, borders, focus, actions, clinical status tones, spacing, typography, radii, elevation, layering, and motion. Map them through Tailwind; preserve status meaning and readable contrast.
2. Extend existing controls into a coherent Button/IconButton, Field/Input/Textarea, Badge, Card/Section, Toolbar, EmptyState, and feedback vocabulary. Use typed variants and composition slots; avoid a universal component with many workflow flags.
3. Pilot Radix-backed dialog and selector/menu behavior behind the existing wrappers. Verify focus containment/restoration, Escape, accessible names, keyboard selection, scroll/portal positioning, nested overlays, and pointer interactions.
4. Separate domain status-to-tone mappings from generic selection and badge presentation. Keep order and medication statuses distinct.
5. Document component contracts, variants, examples, exceptions, disabled/loading/error states, and reduced-motion behavior in `docs/design-system.md`. Provide a development/test component showcase using synthetic content.

**Gate:** Pilot components pass interaction tests and desktop/mobile visual review. Tokens and examples are usable before application-wide migration begins. Preserve existing visual intent; record intentional accessibility changes explicitly.

### Stage 5 — Extract repeated workflow composition

1. Review `App` for separable app coordination, persistence orchestration, and dialog composition. Preserve the single source of patient state, persistence timing, and preview cleanup ownership.
2. Review `SoapView`, `InputSection`, `OrdersView`, `ChatPanel`, and `PatientNoteCard` for cohesive feature hooks and components. Extract by responsibility and independently understandable contracts, not arbitrary size targets.
3. Actively compare repeated card headers/actions, editable sections, search/filter/date toolbars, modal footers, file/media controls, pending/error feedback, and chat composers. Migrate at least two real consumers when promoting a new shared primitive; leave genuinely unique behavior local.
4. Reuse existing media hooks, file helpers, `ClinicalChatInput`, toolbar controls, and status selectors before inventing replacements. Keep transcription, generation, and clinical rules in feature/service code.
5. Audit `components/soap/utils` and the clinical Markdown pipeline together. Consolidate only behavior proven equivalent; protect medical symbols, units, line breaks, lists, raw notes, search highlighting, citations, and source references with fixtures. Print/clipboard formatting may require separate adapters rather than one renderer.

**Gate:** Each extraction has named consumers and focused behavioral verification. Persistence hydration/round trips, resource lifecycle tests, and mocked AI contracts remain green. No catch-all hooks or feature dependencies introduced into shared UI.

### Stage 6 — Migrate every application surface

1. Migrate in bounded groups: application shell/access/dashboard; profile/input; chart/notes/chat; orders/course/handoff; settings/shared dialogs/feedback.
2. Replace repeated visual classes and bespoke controls with the approved tokens and components. Remove superseded implementations as each group completes.
3. Verify keyboard paths, responsive overflow, zoom/readability, forms, loading/error/empty states, status visibility, overlays, and reduced motion. Check prescription/home-instruction print and clipboard content separately.
4. Track each feature group's migration and any justified exception here. Preserve clinician review/edit flows and distinguish generated content from source material.

**Gate:** All listed surfaces are migrated or have a documented functional exception; affected desktop/mobile journeys pass with mocked AI. Do not regenerate snapshots blindly to hide regressions.

### Stage 7 — Final cleanup, regression verification, and handoff

1. Repeat dead-code and duplication review after migrations; remove obsolete wrappers, styles, imports, and temporary adapters. Compare findings with the Stage 2 inventory.
2. Run `npm run typecheck`, `npm run lint`, `npm run docs:check`, `npm run format:check`, `npm test`, `npm run build`, and `npm run test:e2e`, plus newly introduced analyzer/boundary checks. All tests retain Stage 1 safeguards.
3. Review synthetic legacy hydration, stable IDs, attachment bytes/metadata, reload/import/export, resource cleanup, clinical formatting, print/clipboard, and AI request/result contracts. Compare representative bundle and visual baselines; investigate material regressions.
4. Update authoritative documents with final facts, record actual results and remaining limitations, and move this same tracker to `docs/work/done/` only when acceptance criteria pass.

**Gate:** No relevant failing check, unexplained regression, or unexpected provider request. A successful build is not evidence of live AI availability or clinical correctness.

## Acceptance criteria

- [x] Offline AI safeguards apply to every test path: unit tests fail after any attempted fetch/XHR, the test-mode bundle uses a dummy key and blocks SDK construction, and browser tests abort and fail on external HTTP/WebSocket attempts.
- [x] All audited dead-code candidates have a documented disposition; confirmed unused code/files/dependencies are removed.
- [x] Duplication candidates have named consumers and are consolidated or retained with a concrete semantic reason.
- [x] One documented design system governs all application surfaces, with keyboard and desktop/mobile verification.
- [x] Source ownership, imports, and final directory structure match the updated architecture documentation.
- [x] Stable IDs, legacy persistence, attachment round trips, clinical content/formatting, and review workflows are preserved by the existing contract and workflow tests.
- [x] Required checks pass and completed evidence is recorded before closure.

## Progress

All seven stages passed. Stage 4 implemented semantic color/surface tokens, shared Button/Badge/TextInput/TextArea primitives, and Radix Dialog/Select wrappers. Stage 5 confirmed and reused established composable contracts across named consumers rather than adding new abstractions where the behavior was already shared. Stage 6 migrated the application palette classes to ClinSight semantic ramps. Stage 7 completed the regression and dead-code audits. No clinical source content or persisted data fields were deleted.

## Verification

Stage 1 passed `npm run typecheck`, `npm test` (43 files / 105 tests), `npm run build:test`, `npm run test:e2e` (18 desktop/mobile tests), `npm run docs:check`, and `npm run format:check`. Stage 2 repeated typecheck, unit tests, docs/format checks, and E2E after cleanup; `npm run build` passed. Stage 3 passed typecheck/lint, 41 Vitest files / 103 tests, Knip, docs/format checks, and 18 desktop/mobile E2E tests. The Radix pilot passed focused modal/selector tests (5) and the full 41-file / 103-test suite, plus lint, Knip, docs/format checks, and all 18 desktop/mobile E2E tests. Final migration verification passed `npm run lint`, `npm test` (41 files / 103 tests), `npm run check:dead-code`, `npm run docs:check`, `npm run format:check`, `npm run build`, and `npm run test:e2e` (18 desktop/mobile tests). A raw string replacement briefly corrupted Tailwind `translate-*` classes; E2E caught the issue, those classes were corrected, and the full browser suite then passed. Production builds continue to report the >500 kB chunk warning (1,470.37 kB JS / 420.66 kB gzip), which predates no newly identified runtime error but is a bundle-size follow-up. No AI provider API calls were run.

## Outcome

Completed the staged cleanup and consistency refactor. The Stage 2 audit retained clinical order arrays and `SuggestionItem`/`EntryType` shapes as file-internal implementation details rather than deleting behavior. Knip 6.40.0 is wired through `npm run check:dead-code`; it initially identified `components/ui/IconButton.tsx` (no consumers) and `config/clinicalTemplates.ts` (unused re-export), both removed after repository-wide reference checks. Redundant named exports, internal-helper exports, unused gateway request-type exports, and a redundant notification-service object were removed after review. Its current report is clean. Offline AI protections are enforced for unit and browser tests; application code now lives under `src/`; semantic design tokens and shared accessible primitives are in use; repeated workflow foundations have documented consumers; and palette classes use the design-system ramps. Legacy persistence, attachment import/export, stable IDs, clinical presentation, and review workflows passed the relevant existing tests. No real AI API calls were made. Production bundle splitting remains a separate follow-up because the build reports a 1,470.37 kB JavaScript chunk (420.66 kB gzip).

The duplication review confirmed shared contracts already cover the repeated behaviors: `SectionCard` is used in chart and profile; `StickyToolbar`/`ToolbarButton` in input, chart, notes, orders, course, and handoff; `DateRangeFields` in chart and notes; `EditableTextArea` in chart, input, orders, course, and handoff; and `StatusDropdown` under distinct order and medication adapters. These were retained and adopted rather than replaced with redundant abstractions. Feature-specific card bodies, print/clipboard formatting, and AI composers retain their distinct contracts because their content and interaction semantics differ.
