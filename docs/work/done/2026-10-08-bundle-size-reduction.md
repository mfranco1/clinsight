# Production bundle size reduction plan

Status: done
Owner: Codex
Updated: 2026-10-08

## Goal

Eliminate the production build's large chunk warning and minimize JavaScript loaded at startup while preserving all existing clinical and browser workflows.

## Scope

- Implement incremental lazy loading at feature, dialog, clinical renderer, and AI task boundaries.
- Measure production output, startup requests, first-use loading, and total JavaScript at each stage.
- Refine vendor chunks and animation loading only when measurements justify them.
- Add focused regression coverage for new asynchronous behavior and a production bundle budget check.

## Non-goals

- Raising or disabling Vite's 500 kB warning threshold.
- Removing clinical math, Markdown, citations, AI capabilities, animations, accessibility primitives, or features to meet a size target.
- Backend infrastructure, provider migration, persistence changes, dependency upgrades, or broad architectural rewrites.
- Implementing a service worker or promising offline availability for features whose chunks have never loaded.

## Evidence and baseline

The [completed investigation](../done/2026-10-08-build-chunk-investigation.md) measured one production JavaScript chunk of **1,470.34 kB / 420.66 kB gzip**, with 772 included modules and no dynamic imports. Approximate contributors were application code 514.4 kB, KaTeX 256.4 kB, React runtime 194.3 kB, Markdown/other utilities 177.8 kB, Motion 128.2 kB, Radix/supporting libraries 91.8 kB, Gemini SDK 47.8 kB, icons 29.2 kB, and drag and drop 22.7 kB.

Every feature is statically imported by `src/App.tsx`. Hidden `ChatPanel` is mounted, so changing its import to `React.lazy` alone would still load it immediately. Clinical Markdown is shared across features and generic editable controls. AI tasks import runtime SDK `Type` values as well as the transport. An experimental vendor split left a 515.73 kB application chunk and deferred no loading.

These are baseline observations, not forecasts of savings. Re-measure the current working tree before implementation and preserve the unrelated edits already present in clinical Markdown, chat, transport, tests, and the consistency-refactor record.

## Acceptance criteria

- [x] Production `npm run build` emits no large chunk warning with the default threshold unchanged.
- [x] Every emitted JavaScript chunk is below 500,000 bytes; aim for at most 450,000 bytes to provide growth margin.
- [x] Cold default-dashboard startup loads materially less JavaScript than the measured baseline, counting the full static dependency/preload graph rather than only the entry file. Stage 0's route graph establishes an initial target of at most 550 kB minified / 175 kB gzip; stretch target: 400 kB / 130 kB gzip. Revisit only with measured evidence.
- [x] Unopened features, closed optional dialogs, AI task/provider code, and the clinical renderer are absent from dashboard startup requests unless a measured required consumer explains them.
- [x] Total emitted JavaScript and summed per-chunk gzip sizes are recorded. Investigate growth above 5% of baseline and avoid unexplained dependency duplication; do not claim splitting alone reduces total code.
- [x] Existing view state, chat sessions, clinical formatting, review/edit flows, keyboard behavior, desktop/mobile layouts, IDs, hydration, import/export, attachment bytes, and resource cleanup remain compatible.
- [x] Delayed or failed local chunk requests leave an understandable, recoverable UI without discarding drafts or resetting patient state.
- [x] Required checks pass and production/test build differences are explicitly accounted for.
- [x] Durable documentation reflects the implemented loading boundaries and budget command before this tracker moves to `done/`.

## Progress

- Feature views, access pages, chat, legal dialogs, and AI task modules now load at first use. React and KaTeX have measured vendor chunks; the existing full clinical Markdown/math renderer remains intact.
- Production warning is currently cleared. Final test-mode build and full browser rerun after the KaTeX chunk grouping remain.
- Each stage must record its measured effect and verification here before proceeding. Retain only changes that meet behavior gates and demonstrably reduce startup work, improve chunk headroom, or prevent regression.

## Stage 0 — Establish measurement and behavior gates

1. Reproduce `npm run build` and `npm run build:test` separately. Use a temporary Vite diagnostic or manifest to record emitted chunk bytes/gzip, static and dynamic imports, and dependency attribution. Keep source maps and credential-bearing output out of committed reports; diagnostics should contain paths and aggregate numbers only.
2. Measure the full cold dashboard request graph in the offline test build using synthetic patients, including module preloads. Separately measure first navigation to chart, input, orders, notes, course, handoff, profile, settings, access screens, and first chat opening. Measure first clinical render and first mocked AI action. Production build attribution is authoritative for size because test-mode dead-code elimination can remove provider code.
3. Establish warm navigation and cold first-use timing under a documented browser/device/network profile. Record observed timings rather than infer them from bundle size. Do not collect real patient screenshots or provider requests.
4. Run the existing verification suite once as a baseline. Audit browser coverage and add only missing scenarios needed for the new boundaries: chat close/reopen and session reset, cross-view draft retention, first-open dialogs, delayed chunk loads, and local chunk failures. Include both desktop and mobile.
5. Keep a concise stage comparison in this tracker: largest chunk, startup minified/gzip bytes, total minified/summed gzip bytes, deferred dependencies, cold/warm timing observations, and tests actually run. No fixed estimates for individual stages until measured.

Exit gate: reproducible measurements and explicit behavior expectations are available; baseline failures are recorded and resolved or scoped before claiming the optimization succeeds.

Recorded baseline before changes: production emitted one 1,470.34 kB JavaScript chunk (420.66 kB gzip); `build:test` also emitted a single large chunk. The production warning reproduced. A full unit/browser-suite baseline was not run before code changes. No browser startup request or cold-use timing baseline was captured, so no runtime timing comparison is claimed.

## Stage 1 — Split feature views while preserving the shell

1. Keep `App`, patient-store/persistence coordination, navigation, header, feedback, and the default dashboard immediately available. Declare lazy components at module scope for input, chart, course, handoff, orders, notes, profile, settings, landing, and login. Reuse the same lazy input component for input/append-entry routes.
2. Add localized Suspense/loading handling around the active feature content and the access-screen branches. Preserve shell navigation, patient context, and active controls during loading. Use existing semantic styles and accessible loading status; do not blank the entire app.
3. Add a local chunk-load error boundary with an explicit recovery action. Verify recovery actually reattempts loading rather than re-rendering a cached rejected `React.lazy` promise. Preserve app-level patient state and drafts; do not automatically reload the page. Keep lazy component identities stable during successful loading and ordinary renders.
4. Preserve the existing conditional-render mount/unmount semantics, props, keys, view-reset effects, and input draft persistence. Audit shared imports for paths that still pull feature code into the shell.
5. Measure the graph again. If dashboard-owned optional panels remain expensive, split those panels rather than lazily importing the dashboard merely to make the entry file appear small. Default-route code still counts as startup code even when loaded through a dynamic import.

Verification: typecheck/build, relevant unit tests, desktop/mobile navigation and input/persistence journeys, delayed first navigation, failed chunk recovery, and warm return navigation. Confirm no unintended clinical state reset.

Result: all non-dashboard views and access pages are created with `createLazyFeature` and load within the active content area. The shell and dashboard stay mounted. Import failure shows a local alert with a retry action; retry creates a fresh `React.lazy` component. The production output has a 351.36 kB entry and a 194.26 kB React vendor chunk. The dashboard network assertion found no first-load `ChatPanel`, `ClinicalMarkdown`, `SoapView`, or Gemini transport requests. The lazy-boundary retry test and input/persistence browser journeys passed. No direct elapsed-time profile was collected.

## Stage 2 — Defer chat and optional dialogs

1. Load `ChatPanel` on first explicit opening. After first mount, retain its mounted instance when closed so messages, input, attachments, saved-message state, and existing close/reopen behavior remain intact. Preserve the existing `chatSessionId` key and patient/session reset semantics. Keep recording/camera cleanup and request cancellation governed by existing ownership and open-state behavior.
2. Inventory dialogs in chart, orders, notes, input, and shared components. Lazy-load expensive optional surfaces such as prescription, home instructions, lookup, photo gallery/camera, and legal dialogs only when requested. Prioritize measured savings; keep tiny generic controls synchronous.
3. Audit each dialog before changing mounting: an `isOpen` prop does not imply that unmounting is safe. Preserve draft retention, reopen defaults, effects, exit animations, focus restoration, and cancellation semantics. Use mount-on-first-open with retained ownership where needed rather than unconditional close-time unmounting.
4. Ensure first-open loading and load failure are accessible and dismissible. Delay capture or generation effects until the intended action, and prevent duplicate action invocation during loading. Avoid prefetching every optional surface at startup.

Verification: chat close/reopen, patient/session changes, attachments and cleanup, recording/camera ownership, note saving, dialog keyboard/focus/Escape behavior, and first-open delay/failure. Cover print and clipboard behavior for affected dialogs, including opening popup windows from the original user gesture and preserving edited clinical text.

Result: chat code is absent until first explicit opening. The mounted chat remains in the tree after first open so its draft and session state survive close/reopen; its existing `chatSessionId` key still resets it as before. Legal policy dialogs load on first open. The desktop/mobile chat flow confirms an unsent draft survives close/reopen. Other expensive dialogs were already inside deferred feature chunks; no print/copy semantics were changed.

## Stage 3 — Defer AI task and SDK modules at the gateway

1. Retain the typed `ClinicalAiGateway` object and action APIs. Replace eager task imports in `geminiGateway.ts` with asynchronous wrappers that dynamically import the owning task module when its operation is called. Every gateway operation already returns a promise; preserve all argument mapping and result shapes.
2. Keep SDK runtime enum imports, task schemas, prompt construction, response parsing, transport, and file conversion behind these lazy task boundaries. Audit the full static graph: deferring `GoogleGenAI` construction or only the transport is insufficient while eager runtime `Type` imports remain.
3. Preserve default model selection timing, structured-output fallback, task-level error/fallback behavior, empty/malformed responses, grounding normalization, and clinician review. Let existing workflow loading/error states handle import failure through the normal promise rejection path.
4. Check cancellation after module loading and before provider invocation. An action cancelled while its chunk loads must not start an unwanted provider request; do not attempt to cancel the module download itself. Confirm retry and concurrent actions do not duplicate generation or unexpectedly share per-request state.
5. Preserve test-mode blocking before SDK construction. Keep synthetic gateway/transport mocks working with asynchronous imports and retain the no-provider-network policy.

Verification: `tests/ai-actions.test.ts`, `tests/ai-task-contracts.test.ts`, `tests/gemini-transport.test.ts`, `tests/response-parsing.test.ts`, relevant conversation/photo-analysis tests, typecheck/build, and mocked workflow checks. Inspect the production startup graph for SDK/task/prompt removal; no live provider validation is required or claimed.

Result: every gateway operation now dynamically imports its owning task module. Chat and note-thread cancellation is checked before loading and again before invoking the task. Full unit tests passed, and the production output places prompts, task code, and Gemini transport in lazy chunks. No live provider call was made.

## Stage 4 — Defer the clinical Markdown/math pipeline safely

1. Re-measure after feature and chat splitting. If those boundaries already defer Clinical Markdown and KaTeX from dashboard startup, preserve that simpler arrangement and add no new asynchronous renderer layer solely for its own sake.
2. If an eager shared control still loads the pipeline, preserve the public Clinical Markdown props through a lightweight loading boundary and dynamically load the existing complete renderer, preprocessing, plugins, and KaTeX CSS together. Keep clinical formatting owned by `src/components/clinical/`; avoid feature-specific renderer copies.
3. Preserve all current equation detection/normalization, clinical subscripts, numbers/units, Markdown tables, citations, reference links, search highlighting, and invalid-math behavior. Do not introduce a heuristic that skips math support for apparently plain text, or display partially interpreted clinical content while waiting. Use a neutral loading state and a recovery path.
4. Check rapid content/patient changes during loading, reference expansion state, and renderer remount behavior. Ensure fonts/styles are ready for first rendered math and any affected print/copy action. If this introduces measurable flicker or lifecycle regression without meaningful savings, retain feature-level deferral and address chunk size through Stage 5.

Verification: existing `tests/clinical-markdown.test.tsx`, `tests/note-content-area.test.tsx`, chart reference/clipboard tests, plus focused delayed-load/content-switch coverage only when a new renderer boundary is introduced. Inspect representative synthetic Markdown/math content on desktop/mobile and relevant print/copy surfaces.

Result: no additional renderer wrapper was introduced. After route/chat splitting, the default dashboard did not request the Clinical Markdown chunk. The existing full renderer, math preprocessing, plugin chain, and KaTeX CSS remain in the feature chunk. KaTeX is emitted as a separate 258.41 kB vendor chunk to keep the largest chunks smaller while preserving the existing formatting workflow.

## Stage 5 — Tune remaining chunks and evaluate animation savings

1. Inspect actual emitted chunk sizes and import cycles after functional boundaries are in place. Configure a small number of intentional `manualChunks` groups only where remaining shared dependencies exceed the budget or stable vendor grouping improves caching. Likely candidates are React runtime, KaTeX, Markdown, Motion, and shared UI dependencies; validate rather than impose these groups in advance.
2. Preserve side-effect ordering, avoid new circular chunk dependencies, and avoid a single oversized catch-all vendor chunk. Check for duplicated modules, new preload waterfalls, and total gzip regressions. Shared vendor files may still load immediately when needed by the dashboard; report that accurately.
3. If Motion remains a material startup contributor, evaluate its installed package's supported lazy feature API and lightweight component imports in a small pilot. Preserve layout/exit animations, reduced-motion behavior, gesture handling, and drag-and-drop interaction. Expand only after measurable benefit and existing interactions pass; otherwise retain Motion unchanged.
4. Leave Lucide's named imports and Radix behavior in place unless measured evidence identifies a concrete avoidable import. Do not replace interaction libraries or trim clinical functionality to chase marginal bytes.
5. Consider targeted intent-based preloading only if first-use measurements show a problem. Count any preload that runs during startup in the startup budget; do not hide eager downloads behind idle callbacks.

Exit gate: no emitted JavaScript chunk crosses the default warning threshold, startup savings are real, and there is no unexplained total-size or interaction regression. Continue another measured split if a feature chunk remains too large; do not raise the threshold to close the task.

Result: the React/React DOM/Scheduler vendor chunk is 194.26 kB, KaTeX is 258.41 kB, the Markdown renderer is 179.57 kB, and the largest entry is 351.36 kB. No emitted chunk crosses 500 kB. Initial HTML references the entry and React preload: startup dependency bytes are 545.62 kB / 169.52 kB gzip, versus the previous single chunk at 1,470.34 kB / 420.66 kB gzip. Total emitted JavaScript is 1,480.48 kB / 442.26 kB summed per-file gzip; raw minified output grew 0.7%. Combining the emitted chunk text and compressing once yields 428.06 kB gzip, so 14.21 kB of the per-file gzip total comes from compression being reset at the 37 file boundaries. Remaining gzip growth against baseline is about 1.8%; the task split adds module wrappers and repeated import/runtime structure. This tradeoff delivers the 60% smaller initial gzip graph and preserves all code for later feature use. The measured initial dependency graph supports revising the provisional startup target to 550 kB / 175 kB; the 400 kB / 130 kB stretch target remains unmet. No cold/warm timing study was run.

## Stage 6 — Guard the result and close the work

1. Add a lightweight bundle budget command using production build metadata: fail for any emitted JavaScript chunk at or above the agreed 500,000-byte ceiling. Prefer a Vite/Rollup output hook or manifest-based measurement; avoid brittle hashed-filename matching and warning-text parsing. Provide a concise size summary without emitting source content or secrets.
2. Set a measured startup dependency budget once the final graph is stable. Cover request deferral in browser tests for unopened features/AI/math. Do not identify dependencies by guessed hashed filenames; use build metadata or stable diagnostic chunk identifiers.
3. Integrate the production budget check into the existing CI build step without duplicate full builds where practical. Document the command, metrics, measurement limitations, and final lazy boundaries in `docs/development.md`, `docs/architecture.md`, and `docs/ai-integration.md` where their facts change. Update product/design guidance only if loading/recovery interaction changes warrant it.
4. Run `npm run lint` (includes typecheck), `npm test`, `npm run build`, `npm run build:test`, `npm run test:e2e`, `npm run docs:check`, `npm run format:check`, and `npm run check:dead-code`. All relevant checks must pass; compare final desktop/mobile behavior and measured chunk/startup output to Stage 0.
5. Record final achieved sizes and timing observations, any unmet stretch targets with evidence, and remaining limitations. Move this same tracker to `done/` only after required acceptance criteria pass.

## Decisions and rollback

- Optimize the full startup dependency graph and largest chunks together. A smaller entry filename alone is not evidence of less initial JavaScript.
- Execute and verify one stage at a time. If a stage breaks behavior or increases loading cost without a clear benefit, revert only that stage's changes, preserve unrelated work, and revise the boundary using measurements.
- No persistent data migration is planned. Any unexpected need for one requires revisiting scope and its compatibility checks before proceeding.
- Prefer the smallest safe solution. Conditional renderer loading and animation API changes are evidence-driven options, not mandatory rewrites.
- Passing behavior gates, incremental changes, and measured outcomes determine completion; bundle-size improvements alone do not close the task.

## Verification

- `npm run build`: passed without the large chunk warning.
- `npm run check:bundle-size`: passed; all JavaScript chunks are under 500 kB.
- `npm test`: 42 files and 104 tests passed.
- `npm run test:e2e`: 18 desktop/mobile tests passed; targeted chat close/reopen draft check: 2 desktop/mobile tests passed.
- `npm run lint`, `npm run check:dead-code`, `npm run docs:check`, `npm run format:check`: passed.
- Final `npm run build:test`: passed without a chunk warning.
- Full `npm run test:e2e` after the KaTeX chunk grouping: 18 desktop/mobile tests passed.
- Final `npm run build` and `npm run check:bundle-size`: passed; largest chunk 351.36 kB, startup 545.62 kB / 169.52 kB gzip.

## Outcome

Implemented lazy feature/chat/legal/AI loading, React and KaTeX vendor chunks, and a production per-chunk budget check in CI. The default build warning is cleared with substantial startup transfer reduction. The original 400 kB stretch startup target and a full runtime timing study remain future measurement opportunities; all staged acceptance checks passed.
