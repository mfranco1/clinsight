# Composable text and document editors

Status: active
Owner: Codex
Updated: 2026-10-08

## Goal

Give multiline inputs across ClinSight reliable editor behavior and provide a document-style authoring experience for substantial clinical content, while retaining source fidelity, local persistence compatibility, and feature-specific save/review workflows.

## Scope

- Inventory every textarea, reusable input, and editable clinical surface; assign an appropriate compact-text, source-editing, or document-editing experience.
- Shared engine adapters, toolbars, formatting commands, selection/history behavior, previews, paste handling, keyboard access, and lifecycle ownership.
- Staged migration across input, chart, notes, course, handoff, orders, chat, profile, and dialogs wherever multiline inputs exist.
- Use the completed [rendering plan](../done/2026-10-08-rich-content-rendering.md) for syntax support, sanitization, preview, and rendered export. Do not create a second renderer or competing content policy.

## Non-goals

- Backend storage, multi-user collaboration, cloud document conversion, pagination/desktop-publishing parity, AI-provider changes, or unrelated form redesign.
- Replacing every short field with a heavy document editor. All multiline controls receive an explicit UX decision; simple fields retain native semantics when suitable.
- Persisting engine-specific JSON as the new patient contract in this rollout, or silently converting existing clinical source into a normalized document.

## Current implementation and risks

- `EditableTextArea` now routes long-form content through CodeMirror source editing or Tiptap document/source/preview modes, with a draft-preserving plain textarea fallback if the lazy editor fails. Its native compact variant still uses legacy formatting behavior; removal awaits migration/retention decisions for remaining compact consumers.
- Shared callers across input, chart, notes, course, handoff, orders, and home instructions have been inventoried and migrated where multiline source/document editing adds value. Chat, prescription instructions, compact home-instruction recommendations, short structured chart fields, and short status/medication notes retain tailored native controls. `SmartAppendOverlay` and `BulkOrderOverlay` retain their parsing-oriented text contracts and use source editing where appropriate.
- Note-card interaction filtering and keyboard behavior have been updated for editor surfaces. Patient/input/course/handoff editor identities key the draft boundary so one record cannot inherit another record's active draft. Feature-owned draft, attachment, and save flows remain with their owners.
- Home-instruction printing now reads the complete CodeMirror document, including virtualized lines. Other print workflows still use their native input contracts; no migrated editor is substituted there.
- Rich HTML paste allows supported formatting/table structure, strips active content, event/style attributes, unsafe links, and remote-image fetching while keeping image alt text. Its sanitizer has unit coverage; real clipboard paste interaction is not yet verified by a browser test.

## Decisions and engine strategy

Use an engine evaluation before committing to a document model. The recommended source-editor candidate is CodeMirror 6; the recommended document-editor candidate is Tiptap on ProseMirror. CodeMirror offers modular state, transactions, commands, and extensions ([official system guide](https://codemirror.net/docs/guide/)); Tiptap supplies a document-schema approach and a Markdown bridge ([official Markdown documentation](https://tiptap.dev/docs/editor/markdown)). These are candidates, not installed dependencies or a claim of lossless arbitrary HTML/Markdown round trips.

Initial live evaluation supports a dual-engine direction: CodeMirror 6 for explicit source editing and Tiptap for supported visual document editing. Tiptap's React package officially supports React 19 and is MIT licensed ([React integration](https://tiptap.dev/docs/editor/getting-started/install/react), [package metadata](https://github.com/ueberdosis/tiptap/blob/main/packages/react/package.json)). Its Markdown bridge is currently labeled Beta, and its schema drops unsupported HTML by default ([Markdown limitations](https://tiptap.dev/docs/editor/markdown), [schema behavior](https://tiptap.dev/docs/editor/core-concepts/schema)). Therefore visual mode must be gated to a declared, tested subset; source mode remains the fidelity fallback. Neither Markdown-to-document conversion nor arbitrary HTML conversion may be assumed lossless. Dependencies are installed for a local spike; this preliminary finding does not complete Stage 1.

Stage 1 must establish whether one engine satisfies the required modes; use both only if source fidelity and document UX require them and measured loading costs are acceptable. Keep any source engine behind a small React adapter rather than choosing an additional wrapper package by default. Check current stable releases, React 19 compatibility, licensing of the exact extensions, maintenance, advisories, and offline operation. Required functionality must not depend on a paid service or network conversion.

Persist existing strings and IDs. Opening, previewing, switching modes, or saving without edits must return the original source exactly. Document editing may intentionally serialize formatting changes, but must preserve clinical text and meaning. Unsupported nodes remain intact in source mode; do not silently drop them while converting. If a reliable document round trip is not possible, keep that document in source mode with preview and an explanation. A source-only pilot is an intermediate stage, not completion of the document-editing goal.

Proposed primitives, with names/contracts finalized after the spike:

- `src/components/ui/editor/`: `TextEditor` engine adapter, `EditorToolbar`, command controls, source/preview layout, and document-mode adapter. Expose a narrow typed handle for focus, selection insertion, and commands only where callers need it. Engines own transactions/history; UI primitives do not own patient state or AI actions.
- `src/hooks/` or the shared editor directory: reusable draft/selection lifecycle only where multiple consumers need it. Keep feature retention hooks in their existing features.
- `src/components/clinical/`: a clinical editable-content composition combining generic authoring with the shared renderer, source references, and review state.
- `EditableTextArea`: retain its current caller contract as a temporary adapter, migrate callers in batches, then remove or reduce it to a properly owned composition. Coordinate this with rendering-plan ownership work.
- `TextArea`: retain as the native compact-text primitive. Compose capabilities instead of adding a large set of feature flags or patient-specific props.

## Stages

### Stage 0 — Audit workflows and define behavior

- [ ] Inventory all native textareas, `TextArea`, `EditableTextArea`, `ClinicalChatInput`, and contenteditable/third-party editors if any. Record each caller's owner, value type, persistence/draft path, save timing, cancel semantics, keyboard shortcuts, attachments, AI insertion, and print dependencies.
- [ ] Classify long clinical documents (input narrative, notes, SOAP, handoff/course) for document/source/preview modes; short comments for compact editing; and chat, smart append, bulk orders, and prescription fields for tailored compositions that preserve their submit/parsing rules.
- [ ] Establish synthetic fixtures for complex Markdown/HTML/math, long documents, literal backslashes/newlines, tables, clinical numbers/units, and legacy records. Record typing latency, editor-open time, and existing startup/lazy chunk sizes.
- [ ] Write interaction acceptance cases before replacing controls: edit/save/cancel, parent refresh during a dirty edit, patient switch, disabled/read-only behavior, IME, paste, undo, and AI/transcription insertion.

Exit: every input has an intentional target experience and migration owner; no ambiguous persistence or save semantics remain for the pilot.

### Stage 1 — Engine and round-trip spike

- [ ] Prototype CodeMirror source editing and Tiptap document editing against the same fixtures. Test basic formatting, lists, tables, links, math/source islands, safe HTML, and unsupported nodes.
- [ ] Test exact no-op source preservation and semantic preservation after edits; prove repeated source/document/preview switching does not progressively normalize or lose content. Preserve the untouched original separately from the engine's serialization.
- [ ] Evaluate undo grouping, controlled updates, IME/composition, speech input, mobile selection/virtual keyboard, screen-reader navigation, paste from common document editors, and focus within existing Radix dialogs.
- [ ] Measure bundle size and first-open/typing costs using project baselines. Define concrete measured budgets before broad rollout, including many-note pages; instantiate heavy editors only for active editing.
- [ ] Record a library decision here, selected extensions and licenses, supported document subset, fallback behavior, and unresolved limitations. If a candidate fails required document UX or fidelity, evaluate an alternative before declaring the stage complete.

Exit: an engine strategy and conversion contract pass representative fidelity and accessibility cases. No storage schema change is needed; any discovery requiring one becomes separately scoped work before migration proceeds.

### Stage 2 — Shared editing foundation and source-mode pilot

- [ ] Implement controlled value updates without replacing the editor instance on every keystroke. Track document identity separately from its text. External clean updates may replace content; dirty concurrent updates require a visible reconciliation choice, never silent overwrite.
- [ ] Provide undo/redo, formatting toolbar, standard platform shortcuts, selection-preserving commands, indentation/list continuation, find/replace with explicit scope, line wrapping, and optional expanded editing. Preserve browser navigation and provide a keyboard escape from indentation/Tab handling.
- [ ] Implement source/edit/preview switching using the rendering plan's shared renderer. Debounce expensive preview work only; current draft text and explicit save must never lag behind what the user typed.
- [ ] Replace `execCommand` and timer-based selection restoration with engine transactions. Group each formatting, paste, template, or accepted AI insertion as an undoable action. Preserve precision and avoid automatic quote, dash, number, or unit conversion.
- [ ] Keep explicit-save drafts separate from committed values: cancel discards changes. For existing immediate-change consumers, preserve their contract intentionally and verify rollback behavior in the owning adapter.
- [ ] Pilot in note editing through `NoteContentArea` and selected `PatientNoteCard` paths. Update interactive-element hit testing to support editor DOM without changing card actions.
- [ ] Preserve disabled/read-only states, labelled fields, validation/error associations, focus return, Escape and save shortcuts. Destroy editor instances/listeners/timers on unmount; reset history on document identity changes.

Exit: the pilot is usable on desktop/mobile, passes behavioral tests, and can be rolled back through its adapter without data migration. Document-mode work remains required.

### Stage 3 — Document-style editing and composable controls

- [ ] Add visual authoring for paragraphs/headings, emphasis/underline/strikethrough, ordered/unordered/task lists, blockquotes, links, tables, and inline/display math supported by the renderer. Table controls include inserting/removing rows and columns and keyboard navigation.
- [ ] Offer source access and preview consistently. Keep unsupported HTML/math as preserved source or use source-only mode for that document; clearly explain the limitation before any conversion can discard formatting.
- [ ] Provide discoverable, labelled controls with active/disabled states and usable touch targets. Reuse toolbar/button/modal primitives and semantic tokens. On narrow screens, use a usable mode switch and overflow menu rather than squeezing all controls into one row.
- [ ] Define paste choices: ordinary text preserves literal content; formatted paste sanitizes and converts only supported structure. Do not fetch external images, rewrite clinical values, or silently attach files; use existing attachment flows and renderer policies.
- [ ] Keep appending templates, AI suggestions, and transcription under the owning feature's review/action flow. Apply an accepted insertion at a stable selection or explicit append position, with undo and no accidental submit.
- [ ] Test mode-switch fidelity, rich clipboard input, toolbar selection retention, unsupported-content fallback, and save/cancel after format and table operations.

Exit: common clinical documents can be authored visually with dependable source access, undo, and preview; richer mode does not compromise source fidelity or clinician review.

### Stage 4 — Migrate remaining app inputs in batches

- [ ] Batch A: input narrative/templates/drafts, chart SOAP and management sections, course, and handoff. Keep existing draft/history retention and save boundaries in their feature owners.
- [ ] Batch B: order notes, medication comments, bulk-order text, smart append, and status dialogs. Preserve structured parsers and submit behavior; plain-text workflows use compact/source editing without introducing markup into AI/task inputs unexpectedly.
- [ ] Batch C: chat and note inquiry composers. Preserve attachment/camera/recording controls, auto-height, submission rules, composition-event handling, loading/disabled state, and conversation identity isolation.
- [ ] Batch D: prescription/home-instruction editing and remaining profile/dialog inputs identified in stage 0. Coordinate print changes with rendering stage 4 so printing never captures toolbar DOM or stale editor text.
- [ ] For each batch, test labels, keyboard commands, current save/cancel behavior, dirty-state transitions, reload, and responsive layout. Document native-control retention where a richer engine has no UX benefit.
- [ ] Preserve strings at AI gateway boundaries, original notes/grounding, IDs, attachment serialization, and legacy import/export behavior. Do not serialize editor JSON or DOM into those contracts.

Exit per batch: all mapped inputs work with their selected capability tier and relevant offline checks pass. Retire old shortcut/resize implementations only after their last consumer migrates.

### Stage 5 — Hardening, documentation, and rollout completion

- [ ] Verify large-document editing, many-card views, lazy engine loading, lifecycle cleanup, navigation with dirty edits, and error recovery. If loading fails, preserve the draft and provide a usable source/native fallback without remount-induced loss.
- [ ] Run legacy hydration, persistence, draft, import/export, and relevant AI contract tests against synthetic rich-content strings. No-op edit/save and reload/export/import must preserve original source and associations exactly.
- [ ] Verify keyboard-only use, screen-reader labels and announcements, desktop/mobile IME and selection, and print/clipboard workflows. Record manual checks and browser/device limitations explicitly.
- [ ] Update `docs/design-system.md`, `docs/architecture.md`, `docs/product.md`, and `docs/testing.md` with the implemented APIs/behaviors. Update data docs if draft or persistence facts change, and AI docs only if action contracts change.
- [ ] Remove obsolete adapters and duplicated formatting commands. Keep commits/batches independently reversible; never roll back by rewriting saved patient text.
- [ ] Move this same tracker to `done/` after acceptance and checks pass; repair cross-links when either plan moves.

## Acceptance criteria

- [ ] Every multiline input has a recorded migration or intentional native-control decision.
- [ ] Long clinical content supports source editing, preview, and a functional visual document mode for the declared supported subset.
- [ ] Formatting, paste, AI/template insertion, and typing have reliable selection and undo/redo; IME does not trigger unintended saves/submissions.
- [ ] Opening, previewing, cancelling, or saving an untouched document never changes the original source; intentional edits preserve clinical meaning and unsupported source.
- [ ] Dirty edits survive ordinary parent rerenders, cannot overwrite another patient/document, and are not silently replaced by external updates.
- [ ] Existing feature save/cancel, review, draft, attachment, print, and keyboard workflows remain correct.
- [ ] Persisted strings, stable IDs, legacy hydration, import/export, and typed AI boundaries stay compatible.
- [ ] Accessibility, offline tests, performance budgets, bundle checks, and lifecycle cleanup pass.

## Progress

Implementation is active. CodeMirror source editing and conservative Tiptap document mode are in place across notes, chart long-form sections/raw note/references, course details, handoff summary, structured plan lines, general-management fields, smart append, bulk-order syntax, order notes, medication notes, and home-instruction follow-up. New-patient narrative remains source-only to avoid the previously observed external-reset race. The visual toolbar supports emphasis, links, ordered/unordered/task lists, quotes, headings, table row/column operations, and live selection state. Empty documents can open visual mode. Unsupported math/HTML remains available through source mode and shared preview. Chat composers remain native for Enter-to-submit, attachment/recording behavior, and composition-aware submission; prescription sig inputs, compact home-instruction bullets, short structured inline chart fields, and short status notes remain native by design. Home-instruction printing uses the editor's complete current text, including virtualized off-screen lines. Identity keys prevent active edit state crossing patient/input/course/handoff records. Remaining evidence includes real rich-clipboard interaction, full caller contract inventory, and manual accessibility/device checks.

Initial risk findings: `EditableTextArea` globally decoded literal `\\n`, synchronized external values into an active edit without dirty-state protection, used deprecated `execCommand` plus timer-based selection restoration, and lacked an accessible name on its textarea. The first implementation slice now preserves literal source, labels the field, and presents an explicit load-updated/save-my-version choice after a conflicting external update. A `SourceTextEditor` CodeMirror adapter has been added with transaction-based controlled synchronization, undo/redo, find/search, selection-preserving Markdown shortcuts, line wrapping, accessible labeling, and read-only support. `DocumentTextEditor` composes visual/source/preview modes with a conservative exact-round-trip gate, Tiptap formatting/list/link/table controls, and the shared clinical preview. Notes (including generated subnotes), chart long-form sections/raw note, course details, and handoff summary are migrated to document mode; new-patient narrative and structured fields use source mode. Note attachments, input drafts, reset behavior, chart structured data adapters, and note-card interaction filtering remain with their owners. Chat Enter submission now ignores active IME composition. The `execCommand` path remains in the native adapter for unmigrated compact callers.

## Verification

Latest verification after this continuation: `npm test` passed (50 files, 138 tests); `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run docs:check`, `npm run build`, `npm run check:bundle-size`, and `git diff --check` passed. The full Playwright suite passed (26/26), including desktop/mobile task-list toolbar and Markdown round-trip workflows. Paste sanitizer unit tests cover safe formatting/links, active content and remote-image removal, and bounded table spans; browser clipboard delivery remains unverified. Lazy-load failure recovery has a focused error-boundary test. The largest bundle is 448.45 kB (Tiptap vendor), below the 500 kB limit; startup JavaScript is 545.68 kB (169.56 kB gzip). The structured plan's line-oriented action fields use CodeMirror source mode to retain newline-delimited persistence semantics. `npm install` reported 16 dependency vulnerabilities (5 low, 2 moderate, 8 high, 1 critical); `npm audit --omit=dev` identified 8 production advisories including a critical `protobufjs` transitive advisory and KaTeX advisories. A follow-up JSON audit request hit a registry DNS failure, so attribution against the pre-install lockfile is not established. No persistence contract or engine JSON is introduced.

Audit follow-up: CodeMirror virtualizes off-screen lines, so constructing print output from rendered `.cm-line` elements could omit the rest of a long follow-up. The source editor now mirrors its complete current document into `data-print-text`, and print conversion prefers that value; a regression fixture simulates only the first line being rendered. A mounted visual editor now switches immediately to source mode when a changed value contains unsupported Markdown/math. Lazy editor load/render errors fall back to a labelled plain-text editor that retains the active draft and supports save/cancel shortcuts. Rich HTML paste applies a sanitizer, and task-list markdown is round-trip tested. Editor keys now isolate active drafts on patient and document identity changes. The full verification set passes after these additions.

Implementation gates: focused editor/adapter/draft Vitest tests and affected offline Playwright journeys per batch; `npm run typecheck` and `npm run build` for each application-code stage. Before completion run `npm run lint`, `npm test`, `npm run test:e2e`, `npm run check:bundle-size` after build, `npm run docs:check`, and `npm run format:check`. Include existing patient-persistence, input-draft/import, attachment, and affected AI-action tests, plus source round-trip tests. Record actual results and manual device/accessibility evidence here.

## Outcome

Work is active, not rollout-complete. Note, narrative, chart, course, handoff, plan, order, reference, and long follow-up paths use reusable document/source/preview primitives; persisted strings and IDs remain unchanged. Lazy-load recovery, identity isolation, safe rich-HTML paste filtering, task-list source round trips, and virtualized-editor printing are implemented and covered by automated checks. Stage 0's per-caller save/draft/keyboard/AI/print inventory is not yet fully recorded; the Stage 1 screen-reader/mobile/IME/selection and clipboard-editor evaluation remains incomplete. Native retention decisions are recorded above but should be checked against remaining controls. The full Stage 0–5 acceptance checklist remains open; do not move this tracker to `done/` until the remaining audit and manual evidence are resolved or explicitly accepted.
