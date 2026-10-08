# Build chunk warning investigation

Status: done
Owner: Codex
Updated: 2026-10-08

## Goal

Identify the cause and main contributors of the production build's large chunk warning.

## Scope

- Reproduce the warning and measure bundle contributors.
- Trace eager imports and record actionable findings.

## Non-goals

- Application changes, dependency removal, or implementation of bundle splitting.

## Acceptance criteria

- [x] Explain the warning with measured production build evidence.
- [x] Identify major dependencies and their import paths.
- [x] Record remediation options and verification limits.

## Progress

- Production build passes and emits one 1,470.34 kB JavaScript chunk (420.66 kB gzip).
- Attribution, an in-memory vendor splitting experiment, and documentation checks are complete. No remaining investigation work; bundle splitting can be scoped separately.

## Findings

The installed Vite version is 6.4.1. Its reporter compares minified JavaScript bytes divided by 1,000 against the default 500 kB threshold. Gzip size is informational; CSS and font assets do not cause this warning. The build succeeds.

The production bundle contains 772 included modules and no chunk imports or dynamic imports. `src/index.tsx` statically imports `App`; `src/App.tsx` statically imports every feature view, access pages, chat, shared overlays, and `geminiGateway`. Conditional rendering does not create code splitting. `vite.config.ts` has no build chunk configuration, and `src/` has no dynamic imports or React lazy boundaries.

Approximate minified contributions, measured from generated source-map character spans in a production build with `write: false`:

- Application code: 514.4 kB.
- KaTeX: 256.4 kB.
- React, React DOM, and Scheduler: 194.3 kB.
- Markdown pipeline and remaining utilities: 177.8 kB.
- Motion libraries: 128.2 kB.
- Radix and supporting libraries: 91.8 kB.
- Gemini SDK: 47.8 kB.
- Lucide icons: 29.2 kB.
- Drag and drop: 22.7 kB.

These are approximate source attribution values, not exact package bytes or independently compressed sizes. About 2.9 kB of generated characters are unmapped; Unicode and the temporary source-map footer also explain small differences from the actual emitted byte count. Source maps and application source contents remained in memory; only paths and aggregate measurements were printed.

Notable import paths:

- `App` → `SoapView` → `EditableTextArea` → `ClinicalMarkdown` → `rehype-katex` → KaTeX. Chat and other clinical views also use this renderer. Its eager CSS import explains the separate KaTeX font assets.
- `App` → `geminiGateway` → task modules → `geminiTransport` → `@google/genai`. Task modules also import the SDK's runtime `Type` enum, so deferring transport alone would leave another eager SDK path.
- `App` → `OrdersView` → Motion and drag-and-drop libraries. Motion is also used by other eager views and shared controls.
- Shared `ModalShell` and `StatusDropdown` bring Radix dialog/select dependencies into the eager graph.
- Largest individual application modules include `SoapView` (32.3 kB), `LandingPage` (27.4 kB), and AI prompt templates (20.3 kB); no single application module explains the total.

## Remediation options

1. Add lazy feature-view and optional dialog boundaries, with appropriate loading states and preserved clinician workflows. Access pages are another natural boundary.
2. Evaluate loading AI task/provider modules when requested, accounting for runtime schema enum imports. Keep this within the existing client gateway architecture.
3. Evaluate deferring the math-capable renderer while retaining clinical formatting and equation support. Shared eager consumers must all be considered; splitting only chat would not remove the renderer from startup.
4. Use deliberate vendor chunks for caching after measuring the resulting graph. An in-memory experiment separated React, KaTeX, Motion, AI, and other vendors but still produced a 515.73 kB application chunk. All chunks remained statically imported, so this did not defer initial loading. Summed gzip size was about 417.81 kB versus the baseline 420.66 kB; this is only a compression comparison, not a measured loading improvement.

Raising the warning limit suppresses the message without changing transfer or parsing work. No runtime performance profile was run, so this investigation does not quantify startup latency or prescribe an exact final chunk layout.

## Verification

- `npm run build`: passed with the large chunk warning.
- Temporary Vite Node API diagnostic with `write: false`: source-map attribution and vendor-split builds passed; no application/build configuration files changed and no provider calls were made.
- `npm run docs:check`: passed.
- `npm run format:check`: passed.

## Outcome

Identified an eager application/dependency graph as the cause, with KaTeX the largest individual dependency and application code the largest aggregate contributor. Durable warning interpretation and remediation guidance added to `docs/development.md`. The [bundle size reduction plan](2026-10-08-bundle-size-reduction.md) implemented the measured loading boundaries and CI budget.
