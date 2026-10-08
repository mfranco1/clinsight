# Composable text and document editors

Status: planned
Owner: unassigned
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

- `src/components/ui/EditableTextArea.tsx` combines editing state, Markdown shortcuts, native textarea resizing, save/cancel, and `ClinicalMarkdown` display. It uses deprecated `document.execCommand` with a fallback, globally converts literal `\n`, and resets its draft when the parent value changes. Characterize which callers use `onChange`, `onSave`, controlled editing, and hidden controls before changing this contract.
- `TextArea.tsx` is a generic native control. `ClinicalChatInput.tsx` owns a native textarea alongside attachments and recording-related UI. Raw textareas also exist in `SmartAppendOverlay`, `BulkOrderOverlay`, and `PrescriptionModal`.
- Notes use `NoteContentArea` and `PatientNoteCard`; the latter has textarea-specific interaction exclusions. Contenteditable/editor surfaces must not accidentally trigger note selection, card actions, dragging, or parent keyboard handlers.
- Print code in home instructions and prescriptions reads native input/textarea values; an editor engine is not a drop-in replacement for that DOM contract.
- Input draft hooks and other feature state already own retention. Editor internals must not add a new localStorage path or overwrite drafts across patient/encounter changes.

## Decisions and engine strategy

Use an engine evaluation before committing to a document model. The recommended source-editor candidate is CodeMirror 6; the recommended document-editor candidate is Tiptap on ProseMirror. CodeMirror offers modular state, transactions, commands, and extensions ([official system guide](https://codemirror.net/docs/guide/)); Tiptap supplies a document-schema approach and a Markdown bridge ([official Markdown documentation](https://tiptap.dev/docs/editor/markdown)). These are candidates, not installed dependencies or a claim of lossless arbitrary HTML/Markdown round trips.

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

Planning complete; implementation not started. Next action when implementation begins: claim this tracker and perform stage 0. Engine evaluation may start independently of rendering implementation. Stages 2–3 require the rendering plan's stage-1 content contract and stage-2 preview primitive; broad visual-editor rollout must not precede reliable display support. Coordinate the two plans through these deliverables rather than merging their scope.

## Verification

Planning-only change. `npm run docs:check` and `npm run format:check` passed on 2026-10-08. No editor packages installed; no prototype, interaction, accessibility, or performance checks run for the proposed engines.

Implementation gates: focused editor/adapter/draft Vitest tests and affected offline Playwright journeys per batch; `npm run typecheck` and `npm run build` for each application-code stage. Before completion run `npm run lint`, `npm test`, `npm run test:e2e`, `npm run check:bundle-size` after build, `npm run docs:check`, and `npm run format:check`. Include existing patient-persistence, input-draft/import, attachment, and affected AI-action tests, plus source round-trip tests. Record actual results and manual device/accessibility evidence here.

## Outcome

Plan prepared only; application behavior, packages, and current-state documentation remain unchanged until implementation proves the proposed design.
