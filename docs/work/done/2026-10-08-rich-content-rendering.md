# Complete patient-content rendering

Status: done
Owner: unassigned
Updated: 2026-10-08

## Goal

Render patient-facing clinical documentation consistently across chart, notes, course, orders, handoff, and related surfaces, with comprehensive Markdown, supported LaTeX mathematics, and safe HTML fragments, while preserving original source text and clinical meaning.

## Scope

- Shared rendering primitives, explicit syntax and safety policies, clinical citations, search highlighting, responsive styling, and accessible output.
- Migration of both `ClinicalMarkdown` consumers and feature-local formatting paths.
- Existing print and clipboard outputs where they present the same content.
- Coordination with the separate [editor plan](../ongoing/2026-10-08-document-editors.md). This plan owns parsing, display, content policies, and rendered export; that plan owns authoring and editing transactions.

## Non-goals

- Executable HTML, arbitrary CSS, embedded applications, MDX/JavaScript, or full browser-document rendering inside clinical notes.
- A full TeX document compiler or support for every LaTeX package. Unsupported syntax must remain inspectable, never silently disappear.
- Backend infrastructure, AI provider changes, storage-format migration, automatic clinical rewriting, or changes to structured clinical fields.

## Current implementation and risks

- `src/components/clinical/ClinicalMarkdown.tsx` already uses `react-markdown`, `remark-gfm`, `remark-breaks`, `remark-math`, and `rehype-katex`. Raw HTML parsing and sanitization plugins are not installed. The editor's underline shortcut emits `<u>`, so authoring and display capabilities already diverge.
- `preprocessLaTeX` performs global literal-newline conversion, automatic math wrapping, and dash substitution. It does not use Markdown syntax boundaries to protect code, links, and HTML. Characterize existing behavior before replacing it; never persist display transformations.
- `src/components/clinical/formatting.tsx` supplies a second formatting path with symbol replacement, dollar removal, citation badges, and heuristic sentence/list splitting. Chart sections and chat still call these helpers directly. Migrating only `ClinicalMarkdown` would leave inconsistent output.
- Custom paragraph/list/table components only process direct string children for citations and search. Nested formatting needs explicit coverage. Reference rendering calls `new URL(source.uri)` without guarding malformed values.
- `EditableTextArea` couples clinical rendering to a generic UI component. Resolve ownership with the editor plan, without creating competing compatibility layers.
- `HomeInstructionsModal` and `PrescriptionModal` clone DOM and synchronize native input values for printing. Clipboard generation is separately implemented in chart, notes, course, and handoff.

## Decisions and proposed primitives

Retain the installed unified/remark/rehype stack. Add `rehype-raw` and `rehype-sanitize` after a compatibility and dependency review; do not add a second Markdown parser. The [React Markdown documentation](https://github.com/remarkjs/react-markdown) describes its plugin-based rendering and HTML integration.

Proposed boundaries, with final names settled in stage 1:

- `src/components/ui/content/`: a generic `RichContent` renderer, semantic element styling, and fallback/source presentation. Accept content, an explicit format (`plain`, `markdown`, or `html`), and narrow presentation options. Do not infer format from angle brackets or underscores.
- `src/utils/content/`: pure syntax/policy helpers, approved URL handling, and text/HTML export transformations. Keep browser rendering and feature data out of this layer.
- `src/components/clinical/ClinicalMarkdown.tsx`: retain the current public entry point during migration; compose generic rendering with grounding sources, clinical provenance, and reference UI. Clinical adapters own citations rather than embedding patient types in generic UI.
- Explicit Markdown versus HTML-fragment input modes must share sanitization and element rendering. Stage 1 must prove whether `rehype-raw` covers standalone fragment needs or a dedicated unified HTML parser is necessary; mixed Markdown/HTML follows documented CommonMark boundaries.

The proposed pipeline is Markdown/math parsing → HTML AST creation/raw-fragment parsing → restrictive sanitization → trusted KaTeX generation → React components. Allow only necessary pre-KaTeX math marker classes, keep KaTeX `trust: false`, bound macro expansion, and test the order. Sanitizing before trusted math generation avoids broadly allowing user-supplied KaTeX markup; the [sanitizer math example](https://github.com/rehypejs/rehype-sanitize#example-math) explains this tradeoff. [KaTeX options](https://katex.org/docs/options.html) define trust and expansion controls. No later plugin or custom component may reintroduce unsafe user markup or unchecked URLs.

## Stages

### Stage 0 — Inventory and characterization

- [x] Inventory all `ClinicalMarkdown`, `formatLinks`, `formatText`, `renderBulletedContent`, plain preformatted display, and HTML/print construction call sites. Classify each as document content, structured field, or intentionally raw source; record migration or retention rationale here.
- [x] Build synthetic fixtures covering clinical citations, quantities/units, literal backslashes, escaped newlines, code, lists, tables, and mixed HTML/math.
- [x] Characterize rendering, clipboard, prescription print serialization, and source preservation with focused tests. The former clipboard marker removal was corrected to preserve source text.
- [x] Record the production bundle report and representative large-note rendering latency with browser, viewport, and fixture size.

Exit: each display path has an owner and expected contract; regression fixtures and performance baselines exist. No user-visible changes in this stage.

### Stage 1 — Define and prove the content contract

- [x] Specify the declared support contract as CommonMark plus GFM, with safe semantic HTML fragments. Footnotes are explicitly outside the GFM contract and stay literal; unsupported syntax is never executed.
- [x] Specify `$…$`, `$$…$$`, `\(…\)`, and `\[…\]` math, visible invalid-command text, and syntax-aware compatibility handling that skips code and HTML attributes.
- [x] Define safe HTML fragments and preserve table semantics/whitespace. Arbitrary styles, handlers, scripts, frames, forms, and executable schemes are excluded.
- [x] Define safe URL handling, alt-text image fallback without requests, and per-render ID prefixes to prevent clobbering.
- [x] Keep source strings unchanged; use explicit line-break and math compatibility handling only in the display adapter, without global persisted transformations.
- [x] Verify Markdown, standalone HTML, mixed HTML/math, sanitization order, and opt-in source disclosure. Dependencies are locked in `package-lock.json`; the production bundle impact is recorded below.

Exit: a testable support contract and pipeline exist, including clear behavior for unsupported syntax. “Complete” means all declared supported syntax works without clipping or silent loss, not unrestricted HTML or TeX execution.

### Stage 2 — Implement shared renderer and clinical adapter

- [x] Build the shared renderer and clinical adapter with responsive tables/code, heading styles, and KaTeX MathML output.
- [x] Decorate eligible nested text for citations/search while skipping code and existing links; preserve unmatched bracketed numbers.
- [x] Keep source disclosure opt-in and preserve the original content string; filtered HTML never becomes executable.
- [x] Keep the `ClinicalMarkdown` entry point and props compatible; generic rendering remains patient-agnostic.
- [x] Test supported syntax, citations/search, unsafe markup/URLs, invalid math text, numeric units, and exact source preservation.

Exit: the shared renderer passes the contract corpus and security cases, and existing consumers remain functional.

### Stage 3 — Migrate patient displays in reviewable batches

- [x] Migrate chart SOAP sections, assessment/differentials, plans, and inline views while retaining structured labels.
- [x] Migrate notes, course/timeline, handoff, order/medication notes, and profile narratives.
- [x] Migrate chat, lookup results, suggestions, and patient original-note/history views with roles, grounding, and source context intact.
- [x] Account for remaining formatting helpers; they now delegate to the shared clinical renderer, while intentional raw source stays plain.
- [x] Exercise desktop/mobile patient chart workflows, semantic controls, references/highlighting, and long content.

Exit per batch: inventory entries are resolved, focused unit/browser checks pass, and no feature-local alternate parser remains without a documented purpose.

### Stage 4 — Print, clipboard, and rendering cost

- [x] Preserve active prescription/home-instruction field values in existing print serialization; exercise prescription print serialization with unsaved input values.
- [x] Keep clipboard output source-based and preserve numbers, units, and original clinical strings without deriving saved data from rendered DOM.
- [x] Verify sanitization at the React rendering boundary; print exports serialize controlled fields and do not accept generated raw HTML from the renderer.
- [x] Measure an 80-paragraph/80-equation note on desktop and mobile; keep lazy-loaded feature boundaries and the chunk budget.

Exit: print and clipboard fixtures preserve meaning; layout and bundle/performance evidence meet the stage-0 baseline or document a justified budget adjustment.

### Stage 5 — Release verification and documentation

- [x] Run the full unit and desktop/mobile browser suites, lint, build, bundle, docs, formatting, and diff checks against synthetic data.
- [x] Update design-system, architecture, product, and testing documentation for the implemented ownership and support policy.
- [x] Retire the old alternate display formatting path by routing its public helpers to the shared renderer. Persisted source and identifiers remain unchanged.
- [x] Move this tracker to `done/` after acceptance; repair the editor-plan link as a documentation-only reference update.

## Acceptance criteria

- [x] Every inventoried patient-document display uses the shared renderer or retains an explicit structured/raw-source presentation.
- [x] Declared CommonMark/GFM, math, and safe HTML cases render; unsupported syntax remains literal or can be inspected through the opt-in source view.
- [x] Display, clipboard, and print serialization preserve clinical values, source text, provenance, and active field values.
- [x] HTML cannot execute scripts or unsafe schemes, clobber scoped IDs, or trigger remote image requests.
- [x] Nested citations/search skip code and links, preserve unmatched references, and do not alter source text.
- [x] Desktop/mobile browser checks, semantic accessibility assertions, offline tests, and large-document performance checks pass.
- [x] Persisted/imported records and stable identifiers remain unchanged.

## Progress

Implementation and audit are complete for the shared renderer, clinical adapter, chart timeline/original note, course timeline, patient notes, suggestions, lookup results, chat, handoff/profile narratives, and print/clipboard serialization. The audit fixed mixed HTML/math rendering, code-safe search decoration, source-preserving clipboard output, and the repeated-source footer. Markdown uses GFM, KaTeX, a restrictive HTML sanitizer, safe links, and non-fetching image alt text. No editor implementation work has started.

## Verification

`npm test` passed (42 files, 112 tests); `npm run test:e2e` passed (20 desktop/mobile browser tests); `npm run lint`, `npm run build`, `npm run docs:check`, `npm run format:check`, `git diff --check`, and `npm run check:bundle-size` passed on 2026-10-08. Largest JavaScript chunk was 358.38 kB, below the configured 500 kB per-chunk limit. The browser performance fixture rendered 80 paragraphs with 80 inline equations in 928 ms at 1280px and 926 ms at 393px on the local test host (10,000 ms budget). Focused renderer tests cover GFM tables/task lists/nested formatting, four math delimiters, mixed HTML/math, sanitization, safe links, non-fetching image fallback, MathML accessibility output, nested citation/search behavior, code/attribute boundaries, invalid-math visibility, and exact source exposure. Prescription print serialization preserves unsaved field values; clipboard tests preserve original note source.

Implementation gates satisfied: focused rendering/formatting/export tests, offline Playwright journeys on desktop/mobile, `npm run lint`, `npm test`, `npm run test:e2e`, `npm run build`, `npm run check:bundle-size`, `npm run docs:check`, and `npm run format:check`. Persistence/import-export browser tests passed. Screen-reader hardware validation and physical printer output remain outside this display-rendering change; semantic MathML, native details/summary behavior, and print serialization were exercised in automated tests.

## Outcome

The first rendering plan is complete. Automated desktop/mobile rendering, accessibility semantics, print serialization, source preservation, performance, and release checks passed. Persisted patient data contracts and identifiers were not changed. The separate editor plan remains planned and untouched.
