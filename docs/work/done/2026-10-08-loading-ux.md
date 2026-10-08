# Consistent loading and recovery UX

Status: done
Owner: Codex
Updated: 2026-10-08

## Goal

Make first loads, navigation, async workflows, and recovery feel immediate and consistent: render available UI immediately, show branded feedback only where work is pending, and reuse previously loaded views and results safely.

## Scope

- Shared loading, skeleton, pending-action, and recoverable-error primitives using existing design tokens and controls.
- Application startup, lazy views, navigation, feature sections, drawers, dialogs, editors, and AI feedback.
- Session reuse of loaded modules and appropriate view state; safe request coordination and selective parallelism.
- Focused component/lifecycle tests and offline desktop/mobile browser coverage.

## Non-goals

- Backend infrastructure, new persistence formats, a routing rewrite, or the deferred [server-side AI proxy](../ongoing/2026-10-08-server-side-ai-proxy.md).
- Prefetching AI output, automatically repeating clinical generation, or treating generated results as reviewed content.
- Keeping every patient view mounted indefinitely or adding a second persistent patient-data cache.

## Findings from the current implementation

- `src/App.tsx` renders `Sidebar`, `Header`, and `PatientHeader` outside conditional feature views. Preserve this useful shell boundary. Access pages use separate early returns.
- `usePatientStore` initializes synchronously from local storage through `loadPersistedPatients`. Ordinary patient-page visits are not backend fetches; already available records need no artificial skeleton or loading delay.
- `createLazyFeature` originally created its React lazy component inside each wrapper instance. Conditional navigation unmounted these wrappers, which could show a fallback again on return. A deferred import test confirmed the behavior; the implementation now shares successful lazy modules across wrapper remounts.
- `App` resets scroll on view/entry changes. Feature-local state may reset on unmount, while chat and legal dialogs already retain mounted state after first use. Loaded code, patient data, view state, and scroll each need an explicit retention policy.
- `LoadingOverlay` uses a large modal card, a generic document icon, and rotating messages describing unverified processing steps. Feature surfaces also use independent spinners and error treatments.
- `SuggestionsDrawer` keeps its header while waiting but hides section headings and old results during loading. Its result state is not explicitly keyed to draft revisions. Similar loading surfaces exist in lookup, prescription, home-instruction, and chat workflows.
- File uploads and case imports already use `Promise.all`. AI tasks often have real dependencies, such as file conversion before a provider call. There is no evidence yet of a general backend request waterfall to eliminate.
- Existing foundations include `Icons.Logo`, `Icons.Loader`, `Button`, `ModalShell`, `SectionCard`, `EmptyState`, semantic CSS tokens, and local lazy/editor error boundaries. Extend these instead of introducing another UI suite.

## Staged implementation plan

Each stage is a reviewable change with its own relevant tests and documentation updates. Follow the order below; mark a stage complete only after its gate passes.

### Stage 1 — Establish loading and navigation contracts

- Inventory every loading/error surface in `App`, access pages, lazy features, editor fallbacks, input assistance, chart generation/reassessment, photo analysis, prescriptions, home instructions, chat, and note inquiry.
- Classify each as code loading, synchronous local data, async read, explicit AI operation, or mutation. Record its stable chrome, pending region, result owner, cancellation behavior, retry safety, and identity key in this tracker as implementation proceeds.
- Reproduce cold feature navigation and return navigation with deferred imports; establish baseline loader invocation counts, fallback visibility, scroll behavior, and retained drafts. Inspect startup with slow local module delivery and synthetic large stored records.
- Define distinct initial loading, refreshing with usable content, ready, empty, failed without content, and refresh-failed-with-content states. Cancellation returns to the prior usable state without an error alert.
- Define return-navigation scope as revisiting a view in the current app session. A browser hard reload still bootstraps normally; do not introduce URL/history semantics in this work.

Gate: completed. The loading inventory confirmed local patient hydration is synchronous and no general backend read waterfall exists; tests cover lazy first-load and warm-remount behavior. No artificial patient-data request was added.

### Stage 2 — Add composable branded feedback

- Add small generic primitives under `src/components/ui/`, with final names aligned to repository conventions: `LoadingIndicator`, `LoadingScreen`, `Skeleton`, and `ErrorState`. Use slots/children and explicit callbacks; keep fetching and clinical decisions out of these primitives.
- Compose a simple centered `Icons.Logo` and spinner on the canvas/surface background with one concise status label. Support full-screen startup/access loading and contained loading without a heavy card treatment. Reuse the same visual composition for the blocking generation overlay while preserving its cancellation and focus behavior.
- Replace rotating claims about clinical processing with honest labels such as “Preparing chart…” unless real progress events exist. Reserve blocking overlays for operations that require them; unrelated navigation must remain usable for ordinary region loading.
- Provide neutral line, rectangle, and circle skeleton shapes with subtle CSS shimmer. Feature owners compose them into layouts matching actual content dimensions; do not create a configurable universal page skeleton.
- Expose one polite status announcement per pending region, use `aria-busy` on the owning region, and hide decorative logo/spinner/skeleton shapes from assistive technology. Disable shimmer/spin for reduced motion while preserving textual feedback. Keep focus stable when content resolves.
- Reuse `Button` and existing error tokens for concise errors with typed retry/dismiss callbacks. Preserve the editable plain-text fallback in editor failures.
- If Stage 1 confirms a blank pre-React startup interval, add minimal bootstrap markup in `index.html` with matching branding, replaced by React. A React component alone cannot cover the initial bundle download. Share the existing logo source where practical and verify visual parity.

Gate: completed. Component tests cover accessible status text, decorative skeleton semantics, fallback visibility, retry, and warm reuse. CSS supplies reduced-motion overrides; desktop/mobile Playwright workflows pass. The startup bootstrap is covered with a deliberately delayed app bundle. Design contracts are documented in `docs/design-system.md`.

### Stage 3 — Reuse loaded views and preserve intentional state

- Move successful lazy-component/module ownership to the `createLazyFeature` factory lifetime, outside individual mounts. Deduplicate pending loads, retain successful results, and allow an explicit retry to replace a failed attempt. Avoid adding speculative feature imports to the initial bundle.
- Keep errors local to the selected view and distinguish load failures from render failures in recovery behavior. Retry creates a fresh lazy component identity. Never reload the whole app automatically; a browser reload remains an explicit user decision if the browser cannot recover a failed chunk.
- Retain lightweight feature state in its owning feature/session layer where return navigation should preserve it: filters, selected tabs, expanded sections, and existing draft state. Reuse current draft storage rather than adding competing sources of truth. Keep retained state bounded and clear it on patient deletion/logout.
- Key patient-specific state by stable patient/encounter/entry identity as appropriate, and reconcile it against current store data on return. Never show the previous patient's cached content while switching identities.
- Restore main and nested view scroll positions for revisits using the same identity policy; first visits and intentional new-entry navigation start at the top. Preserve keyboard focus and mobile navigation behavior.
- Prefer retaining lightweight state over hidden mounted resource-heavy views. If an existing retained component is reused, ensure hidden editors/media do not remain keyboard-accessible or continue unwanted effects.

Gate: completed. Deferred-loader tests verify successful module reuse, concurrent instances share the load, and a failed load can retry. Browser tests verify chart → orders → chart navigation, patient-scoped order filter retention, and view/entry-keyed scroll restoration. A small in-memory cache retains dashboard and patient-scoped order/note controls; patient deletion and logout clear scoped values. Architecture and product behavior are documented.

### Stage 4 — Render stable structure first and skeletonize pending regions

- Extend `LazyFeature` to accept feature-specific fallback composition. Keep existing navigation and headers outside suspense/error boundaries. Extract lightweight feature frames only where they expose useful titles, tabs, toolbars, section headings, or drawer/dialog footers before the heavy module arrives; reuse the same frame in loaded content to prevent drift.
- Pilot the approach in input suggestions and one patient view, then apply it to chart, notes, orders, course, handoff, profile/settings, access, and async dialogs where warranted by the inventory. Feature skeletons stay in their owning modules and avoid importing heavy implementation dependencies.
- Render headings and data-independent actions immediately. Gate only actions requiring missing data. Replace only the pending result area with a skeleton, then show the loaded data or a genuine empty state.
- During refresh, keep valid existing results readable with a small updating indicator. If the input/patient context changes, remove or clearly mark obsolete generated results and require a deliberate regenerate action; never present an old suggestion as current.
- Preserve chat history during reply generation, local errors next to failed messages, existing editor draft fallbacks, and cancellation controls. Skeletons must not resemble actual clinical facts or imply a result exists.
- Do not defer currently synchronous hydration by default. If measurement justifies post-paint hydration, implement a readiness gate before persistence writes so an initial empty store cannot overwrite saved records; retain legacy/attachment behavior and add dedicated tests first.

Gate: completed. Feature-shaped lazy fallbacks preserve the application shell. Suggestions and home-instruction sections retain headings while content is pending; prescription review uses matching skeleton cards; valid suggestions and prescription results remain visible during refresh. Suggestion and prescription requests reject stale completions. Loading, failure, and retry states are covered by focused tests and desktop/mobile journeys.

### Stage 5 — Coordinate requests and parallelize proven independent work

- Trace actual asynchronous dependencies before changing scheduling. Start independent work together only when both operations are needed by the current action and neither consumes the other's output. Keep conversion → provider call and other genuine dependencies sequential.
- Use `Promise.all` for required all-or-nothing results; let independent sections settle and render separately where partial success is useful. Use bounded concurrency for large file/batch workloads if measurement demonstrates contention. Preserve result ordering and existing import failure semantics.
- Keep request state in feature hooks and typed service/gateway boundaries. Extract a small reusable lifecycle helper only after multiple consumers share its exact needs: abort on replacement/unmount, monotonic request identity, stale-result rejection, and explicit retry.
- Preserve loaded results in session at the appropriate owner and deduplicate equivalent in-flight reads where needed. Identity includes patient/encounter/entry, action inputs or draft revision, model, and relevant options. Avoid raw clinical text in diagnostics or publicly inspectable cache keys.
- Define invalidation at the same time as retention: relevant edits/imports/deletions invalidate affected results, context changes cannot reuse mismatched results, and logout clears session caches. Current patient data remains authoritative in `usePatientStore`.
- Never automatically retry/prefetch AI generation or coalesce distinct explicit clinical actions. An aborted result must not update UI even if the transport cannot stop work already sent to the provider.
- Keep future backend reads compatible with these ownership and loading contracts. Defer a server-state library until real query/cache requirements justify it; existing React, CSS, and Promise primitives are sufficient for this plan. If a library becomes justified, evaluate current official documentation, maintenance, bundle impact, cancellation, and invalidation before adoption.

Gate: completed by inspection. Current patient reads are synchronous. Existing case imports and file conversions already parallelize independent work; the AI workflows inspected depend on prior input/file conversion or are separate explicit clinician actions. No additional concurrent data fetch was justified. Suggestions and prescription request identities now prevent stale results from replacing newer context; existing task/import behavior remains unchanged.

### Stage 6 — Finish consistency, recovery, and regression coverage

- Complete the loading/error inventory migration. Use scoped errors with actionable retry, retain existing content/drafts after refresh failures, and keep empty/offline/cancelled states distinct from failures.
- Normalize user-facing errors at existing service boundaries where necessary so raw provider details or clinical inputs are not exposed. Keep diagnostic reporting free of patient content. Preserve actionable validation errors and current review/edit workflows.
- Add controlled delayed/rejected module and service scenarios to offline tests. Cover startup, first navigation, warm revisit, interrupted navigation, failed chunk recovery, AI error/retry/cancel, and mutation followed by return navigation.
- Verify reduced motion, keyboard operation, mobile/desktop layouts, drawer/dialog close controls, focus restoration, scroll retention, and browser-resource cleanup. Exercise repeated navigation to catch retained-resource growth. Use synthetic patient/attachment fixtures only.
- Compare initial/feature bundle sizes against baseline so lightweight frames and shared primitives do not eagerly pull editors, AI SDKs, or heavy feature modules into startup.
- Update authoritative architecture, product, design-system, testing, and any affected data/AI docs with implemented facts. Move this same tracker to `done/` only after all criteria and relevant checks pass.

Gate: completed. All required checks passed; offline validation does not establish live AI availability or clinical correctness.

## Acceptance criteria

- [x] Initial blocking/loading screens use the existing app logo and a simple centered indicator, with accessible status and reduced-motion support.
- [x] Available shell, headings, controls, sections, and applicable footers render immediately; pending content alone receives appropriate placeholders.
- [x] Local data already in memory renders without artificial waits; refreshing usable content does not blank it.
- [x] Previously resolved views return without a loading fallback or unnecessary request, while app drafts, relevant filters, and scroll survive safely.
- [x] Patient/entry changes, edits, imports, deletion, and logout obey explicit retention/invalidation rules without leaking content across contexts.
- [x] Proven independent work runs concurrently where beneficial; dependent and explicit clinical actions preserve their semantics.
- [x] Loading, empty, error, retry, refresh, and cancellation behavior are consistent, local where possible, and preserve clinician review.
- [x] Shared primitives remain generic; feature layouts, request ownership, persistence, and provider details stay within documented boundaries.
- [x] Relevant new tests and the final verification suite pass, with desktop/mobile browser coverage and no material startup-bundle regression.

## Progress

- Stages 1–6 implemented. Added shared loading/skeleton/error primitives, an HTML bootstrap screen, persistent lazy module identity, session-scoped view-control state, navigation scroll restoration, and representative feature-specific skeleton/error recovery.
- Patient records remain synchronously hydrated from local storage. Current workflows did not justify new parallel data fetching; existing file/import concurrency remains intact.
- Final verification passed: typecheck/lint, 149 unit tests, docs/format checks, production build, bundle-size check, and desktop/mobile Playwright (31 passed, 1 skipped).
- Audit follow-up fixed mounted `useRetainedState` key changes so patient-scoped values resolve against the new identity immediately; regression coverage verifies values do not cross keys. The same audit made home-instruction results and errors source-scoped and invalidated superseded requests when closing or changing the SOAP note. Re-ran lint/typecheck, all unit tests, docs and format checks, production build, browser tests, and `git diff --check` after the fixes.

## Decisions

- Fix module identity and feature state retention separately; browser module caching alone does not preserve React component state.
- Prefer existing dependencies and composition. No new library or backend is required by the current evidence.
- Keep future-facing query behavior scoped to actual consumers, with explicit identity and invalidation rather than a speculative global data layer.

## Verification

- `npm run lint` passed.
- `npm test` passed: 149 tests across 52 files.
- `npm run docs:check`, `npm run format:check`, and `git diff --check` passed.
- `npm run build` and `npm run check:bundle-size` passed. Startup JavaScript: 549.71 kB raw / 170.88 kB gzip; largest chunk: 448.45 kB under the 500 kB limit.
- `npm run test:e2e` passed: 31 desktop/mobile tests passed, 1 skipped. Includes delayed-bootstrap and return-navigation checks.

## Outcome

Implemented the staged loading UX improvements, reusable feedback primitives, identity-scoped view controls, and regression coverage. AI availability and clinical correctness remain outside offline test coverage.
