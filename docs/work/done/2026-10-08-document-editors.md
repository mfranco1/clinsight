# Composable text and document editors

Status: done
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
- Rich HTML paste allows supported formatting/table structure, strips active content, event/style attributes, unsafe links, and remote-image fetching while keeping image alt text. Sanitizer unit tests and a ProseMirror paste-event integration test verify the conversion; operating-system clipboard integration remains outside the browser automation fixture.

## Input ownership and workflow inventory

- **Patient notes and generated subnotes —** `NoteContentArea` and `PatientNoteCard` keep save/cancel, grounding references, note attachments, card selection, and collapsed-card behavior in the notes feature. Long content uses document mode; math/unsupported content falls back to source. The enclosing note remains the persisted string and stable note ID.
- **Chart narrative and SOAP —** `InputSection` retains its feature-owned patient/input draft, templates, transcription, and AI review flows; its narrative uses source mode and is keyed by patient plus append/new-patient identity. Long SOAP sections and lab/imaging interpretation use document mode; line-oriented plan, exam entries, and structured management fields use source/native editing to preserve their parsing and array contracts. Raw note editing is explicit-save/cancel and writes the edited string to the existing `rawText` and `originalNote` fields. References remain source strings with the existing grounding metadata.
- **Course and handoff —** course details are document-edited and update their owning course event as the value changes; keys include patient/event context. Handoff summary is document-edited with live feature update and explicit Save/Cancel, keyed by patient. Neither editor creates a new persistence format.
- **Orders —** AddOrderModal and PatientOrderCard keep order comments in feature-local draft state until the surrounding save action; MedicationOrderRow follows the same pattern for medication notes. These use source mode. BulkOrderOverlay uses source mode because its exact plain-text grammar feeds the existing parser and preview; integrate/cancel remains explicit. Short order/medication status notes use compact native controls.
- **Smart append and AI insertion —** SmartAppendOverlay accepts clinician text or transcription into a source editor, presents the existing generated suggestions, and only calls `onIntegrate` from its explicit action. Suggestions and transcription remain in the owning workflow; the editor does not submit on Enter or call an AI action itself.
- **Home instructions —** longer follow-up uses source mode and retains its existing feature update/print behavior; printing reads the complete editor document. Short recommendations remain compact native fields. Prescription instructions remain a controlled, autosizing native textarea in the prescription modal, preserving the medication item contract and print path.
- **Chat and dialogs —** `ClinicalChatInput` remains native to retain attachments, camera, recording/transcription, autosizing, Enter-to-submit, Shift+Enter newline, disabled/loading states, and IME-safe submission. PatientStatusModal's additional-death-notes field uses the shared native `TextArea` and is committed with the modal action. No profile-specific multiline control was found in the current source inventory.
- **Shared editor/native controls —** `EditableTextArea` is the adapter for 29 callers (9 document-mode and 13 source-mode; the remaining callers are short inline/native fields or tailored parsing workflows). `TextArea` has one current caller. React and CodeMirror contenteditable surfaces are included in note-card interaction filtering. Source editor AI/template/transcription insertions remain value-controlled by feature owners; no feature depends on private editor state or a new storage key.

The inventory is a source audit, not a claim that every workflow was manually exercised on a physical device. Automated save/cancel, dirty-update, identity-reset, IME, and browser workflows are noted in verification below; screen-reader and physical mobile IME checks remain a rollout limitation.

## Decisions and engine strategy

The engine spike selected CodeMirror 6 for source editing and Tiptap on ProseMirror for supported visual documents. CodeMirror offers modular state, transactions, commands, and extensions ([official system guide](https://codemirror.net/docs/guide/)); Tiptap supplies a document-schema approach and a Markdown bridge ([official Markdown documentation](https://tiptap.dev/docs/editor/markdown)). Both are MIT-licensed at the installed versions. This selection does not claim lossless arbitrary HTML/Markdown round trips.

The installed Tiptap React package supports React 19 and is MIT licensed ([React integration](https://tiptap.dev/docs/editor/getting-started/install/react), [package metadata](https://github.com/ueberdosis/tiptap/blob/main/packages/react/package.json)); the selected list, table, and Markdown packages are also MIT licensed. Its Markdown bridge is currently labeled Beta, and its schema drops unsupported HTML by default ([Markdown limitations](https://tiptap.dev/docs/editor/markdown), [schema behavior](https://tiptap.dev/docs/editor/core-concepts/schema)). Therefore visual mode is gated to a declared, tested subset; source mode remains the fidelity fallback. Math and raw HTML are source-only. Markdown tables are allowed only when table serialization reparses to the identical document tree and all non-table source is preserved; formatting may normalize only after edits. No markdown/document conversion is claimed lossless beyond those tested contracts.

The dual-engine design is retained because source mode needs line-oriented editing/search and explicit source fidelity while visual mode needs schema-backed document editing. CodeMirror is behind a small React adapter; Tiptap dependencies are lazy-loaded with document mode. The build budget keeps the largest chunk below 500 kB and reports startup and total JavaScript sizes. All editor operations are local and offline. Maintenance and current security advisories should be rechecked as part of dependency updates.

Persist existing strings and IDs. Opening, previewing, switching modes, or saving without edits must return the original source exactly. Document editing may intentionally serialize formatting changes, but must preserve clinical text and meaning. Unsupported nodes remain intact in source mode; do not silently drop them while converting. If a reliable document round trip is not possible, keep that document in source mode with preview and an explanation. A source-only pilot is an intermediate stage, not completion of the document-editing goal.

Proposed primitives, with names/contracts finalized after the spike:

- `src/components/ui/editor/`: `TextEditor` engine adapter, `EditorToolbar`, command controls, source/preview layout, and document-mode adapter. Expose a narrow typed handle for focus, selection insertion, and commands only where callers need it. Engines own transactions/history; UI primitives do not own patient state or AI actions.
- `src/hooks/` or the shared editor directory: reusable draft/selection lifecycle only where multiple consumers need it. Keep feature retention hooks in their existing features.
- `src/components/clinical/`: a clinical editable-content composition combining generic authoring with the shared renderer, source references, and review state.
- `EditableTextArea`: retain its current caller contract as a temporary adapter, migrate callers in batches, then remove or reduce it to a properly owned composition. Coordinate this with rendering-plan ownership work.
- `TextArea`: retain as the native compact-text primitive. Compose capabilities instead of adding a large set of feature flags or patient-specific props.

## Stages

### Stage 0 — Audit workflows and define behavior

- [x] Inventory all native textareas, `TextArea`, `EditableTextArea`, `ClinicalChatInput`, and contenteditable/third-party editors if any. Record caller ownership, persistence/draft path, save/cancel behavior, keyboard/IME rules, attachments, AI insertion, and print dependencies in the input inventory.
- [x] Classify long clinical documents (input narrative, notes, SOAP, handoff/course) for document/source/preview modes; short comments for compact editing; and chat, smart append, bulk orders, and prescription fields for tailored compositions that preserve their submit/parsing rules.
- [x] Establish synthetic fixtures for Markdown/HTML/math, long documents, literal backslashes/newlines, tables, clinical numbers/units, and legacy records. Measure large-document render responsiveness and startup/lazy chunk sizes; retain the 500 kB maximum-chunk budget.
- [x] Cover edit/save/cancel, parent refresh during dirty edits, patient identity boundaries, disabled/read-only behavior, IME, rich paste, undo/redo, and feature-owned AI/transcription insertion paths with component and browser tests.

Exit: every input has an intentional target experience and migration owner; no ambiguous persistence or save semantics remain for the pilot.

### Stage 1 — Engine and round-trip spike

- [x] Prototype CodeMirror source editing and Tiptap document editing against representative fixtures. Test formatting, lists, tables, links, math/source fallback, safe HTML paste, and unsupported nodes.
- [x] Test exact no-op source preservation and semantic preservation after edits; verify repeated source/document/preview switching does not progressively normalize or lose content. Preserve the untouched original separately from engine serialization.
- [x] Verify undo/redo, controlled updates, IME/composition guards, browser selection retention, mobile viewport behavior, accessible names/roles, paste-event sanitization, and focus/keyboard workflows through component and browser tests.
- [x] Measure bundle and large-document rendering costs. The largest built chunk is below the 500 kB maximum, and editors are lazy-loaded only for active editing.
- [x] Record the dual-engine decision, selected extensions/licenses, supported document subset, fallback behavior, and limitations. Raw HTML and math stay source-only; visual mode is schema-gated.

Exit: an engine strategy and conversion contract pass representative fidelity and accessibility cases. No storage schema change is needed; any discovery requiring one becomes separately scoped work before migration proceeds.

### Stage 2 — Shared editing foundation and source-mode pilot

- [x] Implement controlled value updates without replacing editor instances on each keystroke. Track document identity separately from text. Accept clean updates and present a reconciliation choice after conflicting dirty updates.
- [x] Provide undo/redo, formatting controls, platform shortcuts, selection-preserving commands, search, line wrapping, list behavior, and keyboard cancel/save. Native compact fields keep plain-text behavior.
- [x] Implement source/visual/preview switching using the shared clinical renderer. Draft changes reach feature owners immediately; explicit saves use the current draft.
- [x] Remove deprecated `execCommand` and timer-based selection restoration. Editor commands and paste handling use engine transactions; clinical numbers and units are not transformed.
- [x] Keep explicit-save drafts separate from committed values; preserve immediate-change consumer contracts in their owning features.
- [x] Pilot notes through `NoteContentArea` and `PatientNoteCard`; editor DOM remains excluded from parent card actions.
- [x] Preserve disabled/read-only states, labelled fields, focus behavior, Escape/save shortcuts, cleanup on unmount, and identity-bound draft/history boundaries.

Exit: the pilot is usable on desktop/mobile, passes behavioral tests, and can be rolled back through its adapter without data migration. Document-mode work remains required.

### Stage 3 — Document-style editing and composable controls

- [x] Add visual authoring for paragraphs/headings, emphasis/underline/strikethrough, ordered/unordered/task lists, blockquotes, links, and tables. Math remains source-only until a math node schema is proven. Table controls insert/remove rows and columns and use ProseMirror keyboard navigation.
- [x] Offer source access and preview consistently. Unsupported HTML/math remains preserved in source mode with an explanation before visual editing is unavailable.
- [x] Provide labelled controls with active/disabled states and touch targets. On narrow screens the view switch stays visible while the formatting toolbar scrolls horizontally.
- [x] Sanitize rich HTML paste to supported structure; preserve ordinary text, strip active content and unsafe links, and convert images to alt text without fetching or attaching them.
- [x] Keep templates, AI suggestions, and transcription within feature-owned review/action flows. Existing owners apply accepted insertions to controlled drafts; editor controls do not submit AI actions.
- [x] Test mode fidelity, paste transformation, selection-retaining formatting, undo/redo, table/task-list editing, unsupported fallback, and save/cancel shortcuts.

Exit: common clinical documents can be authored visually with dependable source access, undo, and preview; richer mode does not compromise source fidelity or clinician review.

### Stage 4 — Migrate remaining app inputs in batches

- [x] Batch A: input narrative/templates/drafts, chart SOAP and management sections, course, and handoff; feature owners retain draft/history and save boundaries.
- [x] Batch B: order notes, medication comments, bulk-order text, smart append, and status dialogs; parsers and submit behavior remain intact.
- [x] Batch C: chat and note inquiry composers retain attachment/camera/recording, auto-height, submission, composition-event, loading, and conversation behavior.
- [x] Batch D: home instructions and remaining dialog inputs are migrated or have documented native-control decisions; print output excludes editor chrome and includes complete text.
- [x] Test labels, keyboard commands, save/cancel behavior, dirty transitions, identity isolation, persistence, and desktop/mobile browser layout. Retain native controls for compact fields where editor engines add no value.
- [x] Preserve AI boundary strings, original notes/grounding, IDs, attachment serialization, and legacy import/export. No editor JSON or DOM is stored.

Exit per batch: all mapped inputs work with their selected capability tier and relevant offline checks pass. Retire old shortcut/resize implementations only after their last consumer migrates.

### Stage 5 — Hardening, documentation, and rollout completion

- [x] Verify large-document responsiveness, lazy editor loading, lifecycle cleanup, identity changes, and error recovery. Editor failures preserve the current draft in a usable fallback.
- [x] Run legacy hydration, persistence, draft, import/export, and relevant AI boundary tests with synthetic content. No-op edit/save and data round trips preserve source and associations.
- [x] Verify keyboard shortcuts, accessible roles/names, mobile viewport, IME guards, selection behavior, and print/paste transforms in automated tests. Physical screen-reader, OS clipboard, and native-device IME testing is unavailable in this browser automation environment and is recorded as a release validation limitation.
- [x] Update design-system, architecture, product, and testing documentation with editor ownership and behavior. Persistence and AI contracts did not change.
- [x] Remove obsolete native formatting commands and window-listener leaks; keep saved values as source strings.
- [x] Move this tracker to `done/` after final checks pass and repair cross-links.

## Acceptance criteria

- [x] Every multiline input has a recorded migration or intentional native-control decision.
- [x] Long clinical content supports source editing, preview, and visual editing for the declared supported subset, with math/HTML fallback documented.
- [x] Formatting, paste, feature-owned AI/template insertion, and typing retain selection and history; IME guards prevent accidental saves/submissions.
- [x] Opening, previewing, cancelling, or saving untouched content preserves the original string; intentional edits preserve clinical text and unsupported source.
- [x] Dirty edits survive parent updates, are isolated by patient/document identity, and surface external conflicts.
- [x] Feature save/cancel, review, draft, attachment, print, and keyboard workflows pass relevant tests.
- [x] Persisted strings, stable IDs, legacy hydration, import/export, and typed AI boundaries remain compatible.
- [x] Accessibility semantics, offline tests, performance budgets, bundle checks, and lifecycle cleanup pass; physical-device limitations are recorded in Stage 5.

## Progress

Implementation is complete for the declared capability tiers. CodeMirror source editing and conservative Tiptap document mode cover notes, chart sections/raw note/references, course, handoff, structured plan lines, management fields, smart append, bulk-order syntax, orders, medications, and home-instruction follow-up. The visual toolbar supports emphasis, links, lists/checklists, quotes, headings, tables, undo/redo, and selection-preserving commands. Math/HTML remains available through source and shared preview. Chat composers retain attachment, recording, submission, and IME behavior; prescription instructions and compact inline/status fields retain native controls by design. Printing uses the complete editor document, identities isolate drafts, and lazy failures retain drafts in a plain editor fallback. The full caller inventory is recorded above.

Initial risk findings: `EditableTextArea` globally decoded literal `\\n`, synchronized external values into an active edit without dirty-state protection, used deprecated `execCommand` plus timer-based selection restoration, and lacked an accessible name on its textarea. The implementation now preserves literal source, labels the field, and presents an explicit load-updated/save-my-version choice after a conflicting external update. `SourceTextEditor` uses CodeMirror transactions, history, search, selection-preserving Markdown shortcuts, line wrapping, accessible labeling, and read-only support. `DocumentTextEditor` composes visual/source/preview modes with a fidelity gate, Tiptap formatting/list/link/table controls, and the shared clinical preview. The deprecated native formatting/selection path has been removed; compact text fields retain plain editing with save/cancel shortcuts, and resize listeners are released if the owner unmounts. Note attachments, input drafts, reset behavior, chart structured data adapters, and note-card interaction filtering remain with their owners. Chat Enter submission and all editor save shortcuts now ignore active IME composition.

## Verification

Final verification: `npm test` passed (50 files, 143 tests); `npm run lint`, `npm run format:check`, `npm run docs:check`, `npm run build`, `npm run check:bundle-size`, and `git diff --check` passed. Playwright passed 27 desktop/mobile tests, with one expected desktop skip for the narrow-screen-only toolbar assertion. Component tests exercise the ProseMirror paste event through the sanitizer; browser automation does not expose the operating-system clipboard. Lazy-load failure recovery has a focused error-boundary test. The largest bundle is 448.45 kB (Tiptap vendor), below the 500 kB limit; startup JavaScript is 545.68 kB (169.56 kB gzip). The structured plan's line-oriented action fields use CodeMirror source mode to retain newline-delimited persistence semantics. `npm install` reported 16 dependency vulnerabilities (5 low, 2 moderate, 8 high, 1 critical); `npm audit --omit=dev` identified 8 production advisories including a critical `protobufjs` transitive advisory and KaTeX advisories. Registry DNS prevented a follow-up attribution against the original lockfile. No persistence contract or engine JSON is introduced.

Audit follow-up: CodeMirror virtualizes off-screen lines, so constructing print output from rendered `.cm-line` elements could omit the rest of a long follow-up. The source editor now mirrors its complete current document into `data-print-text`, and print conversion prefers that value; a regression fixture simulates only the first line being rendered. A mounted visual editor now switches immediately to source mode when a changed value contains unsupported Markdown/math. Lazy editor load/render errors fall back to a labelled plain-text editor that retains the active draft and supports save/cancel shortcuts. Rich HTML paste applies a sanitizer, and task-list markdown is round-trip tested. Editor keys now isolate active drafts on patient and document identity changes. The full verification set passes after these additions.

## Outcome

Implementation and automated acceptance are complete. Existing storage strings, IDs, AI contracts, and feature save/review boundaries remain unchanged. Browser automation covers desktop/mobile flows, accessibility roles and labels, visual selection/undo/redo, table/task-list editing, IME guards, paste sanitization, persistence, and print output. Physical screen-reader, native-device IME, and OS clipboard validation remain release checks because this environment provides browser automation only; no app-level limitation is known from the automated checks.
