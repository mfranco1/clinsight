# Composable UI primitives and workflow consistency

Status: active
Owner: Codex
Updated: 2026-10-12

## Goal

Consolidate repeated UI structure and interaction into composable, customizable, on-brand primitives while preserving clinical content, workflow behavior, stable IDs, drafts, persistence, and AI review boundaries.

This tracker records implementation of the staged plan. “Bottom panels/drawers” is the interpretation of “Botton Panels/Drawers.”

## Scope

All fourteen requested families: modals; toast/popup alerts; confirmations; menus/dropdowns; sticky toolbars; side panels/drawers; bottom panels/drawers; page navigation; search; filters; empty/splash pages; operational tables such as orders and medications; loading states; and error states. Loading and error states are first-class, cross-cutting compositions, not just variants of splash pages or toasts.

Cover desktop and mobile, keyboard and assistive technology, pending/error/disabled states, reduced motion, overlapping surfaces, and the lifecycle of hidden or unmounted content. Consolidation includes migrating existing consumers, not merely adding a component library.

## Non-goals

- No backend, router replacement, state-management replacement, persistence migration, or AI gateway redesign.
- No change to clinical status values, clinical text, medication units, order parsing, filtering rules, or clinician review requirements.
- No second design system, wholesale visual redesign, generic workflow engine, global modal registry, or universal configuration-driven page component.
- No speculative command palette, fuzzy search, remote search, table virtualization, drag-to-dismiss, or new sorting/pagination behavior. Add such capabilities only with a demonstrated consumer and separately recorded behavior requirements.
- Rich-content/editor tables retain their existing rendering and source-fidelity contracts. They are not operational data tables.

## Evidence and current starting point

Inspection on 2026-10-12 found no application changes before this plan. The untracked tracker was present at implementation start. Findings below are source observations, not a completed accessibility audit.

1. **Modals:** `src/components/ui/ModalShell.tsx` already wraps Radix Dialog with controlled visibility, sizes, header/body/footer composition, and focus/dismissal foundations. Lookup and shared dialogs use it. Prescription, bulk orders, smart append, and input confirmations still contain custom overlay markup. Extend the existing shell before introducing another API.
2. **Feedback:** `src/components/Toast.tsx` portals individual messages with a default five-second timeout. App and feature consumers own separate messages; the chart has a separate persistent fixed alert. The toast has no live-region role in its current markup. `notificationService.ts` handles browser notifications and must remain a separate channel.
3. **Confirmations:** `ConfirmationModal.tsx` invokes `onConfirm()` and then immediately closes. This synchronous compatibility contract must not silently become asynchronous or add a second callback invocation during migration.
4. **Menus/selectors:** `StatusDropdown.tsx` already uses Radix Select and separate order/medication adapters. `ToolbarSelect` uses a native select. Input menus use custom positioning/listeners, and `ManageSectionsDropdown.tsx` uses an absolutely positioned surface with richer controls. These require different semantics, even if their styling converges.
5. **Toolbars:** `StickyToolbar.tsx` and `ToolbarSections.tsx` are already shared widely. Offsets, outer spacing, overflow, and some icon-only accessible names need an explicit contract. Extend them rather than recreating each view toolbar.
6. **Side panels:** suggestions use a mobile backdrop and a fixed right surface; chat has separate resize logic and stays mounted while closed. Chart history is an inline desktop aside. The task sidebar is ordinary complementary content. These must not all become modal drawers.
7. **Bottom surfaces:** smart append aligns to the bottom on small screens and centers on larger screens. Orders have a portalled multi-selection action surface. A nonmodal action bar is not a bottom-sheet dialog.
8. **Navigation:** `App.tsx`, `app/shell/Sidebar.tsx`, `NAV_ITEMS`, and `ViewState.tsx` already own view selection, desktop/mobile navigation, retained controls, and view/identity-specific scroll restoration. Preserve these owners.
9. **Search:** `ToolbarSearch` is reused, but its current input relies on placeholder presentation without an explicit label prop. Feature selectors own matching. Preserve query and matching behavior while improving the control contract.
10. **Filters:** dashboard, chart, notes, and orders compose repeated controls with different selection rules. Notes/orders retain patient-scoped UI state; chart history has its own hook and pagination. `DateRangeFields` already exists.
11. **Empty/splash:** `EmptyState` and `LoadingFeedback` exist, alongside feature-specific empty states. Startup HTML, React loading, login, no patient, and no search results have different purposes and lifecycle constraints.
12. **Tables:** orders and medications currently use responsive div/CSS-grid rows and headers, not native HTML tables. Diagnostics also have date/group structure and group actions. Extracting a generic table must preserve mobile cards, inline editing, grouping, selection, and status adapters.
13. **Loading:** `LoadingFeedback.tsx` already exports `LoadingBar`, `LoadingBarIndicator`, `LoadingIndicator`, `LoadingScreen`, `Skeleton`, and `SkeletonSection`. `LoadingOverlay.tsx` composes the shared bar and brand with an optional cancel action. `createLazyFeature` supplies local Suspense feedback and caches successful lazy components across wrapper remounts. Extend these foundations rather than introducing a parallel loading suite.
14. **Errors:** `ErrorState` provides an alert with title, message, and action slot. `LazyFeatureErrorBoundary` supplies local retry in `LazyFeature.tsx`; `EditorErrorBoundary` preserves the owning editor workflow through a supplied fallback. `appErrors.ts` provides typed application errors and message extraction helpers; those helpers do not themselves redact arbitrary error messages. Keep error classification/recovery in feature/service owners and reuse shared presentation.

Relevant existing tests include `modal-shell`, `status-dropdowns`, `view-state`, `lazy-feature`, `loading-feedback`, `orders`, `note-listing`, `chart-history`, panel resize, drafts, editor fidelity, persistence, and the offline Playwright journeys. Current modal tests cover naming and Escape; they do not establish full focus, nested-layer, or mobile behavior.

### Stage 0 consumer map

This source map records representative owning modules and migration intent; consumers outside this list still require the Stage 9 final sweep.

| Family                | Current owners/consumers                                                                                                                                                      | Starting disposition                                                                                           |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Modals                | `ModalShell`, `LookupModal`, dialog modules, `AddOrderModal`, prescription/bulk-order overlays, smart append, camera capture, privacy/terms, `PlanSection`, `GenerateRxModal` | Reuse shared dialog where modality fits; keep print/media/editor details in feature composition.               |
| Toasts/alerts         | `App`, dashboard, chart, profile, `EditablePlanCard`, chart/input/editor/notes/order local alerts                                                                             | Improve shared status semantics; retain persistent inline workflow errors and notification service separately. |
| Confirmations         | course, notes/cards, orders/cards, patient status, chart status/history                                                                                                       | Keep `ConfirmationModal` and owner callbacks; preserve synchronous close contract.                             |
| Menus/dropdowns       | status adapters; `ToolbarSelect`; input menus; `ManageSectionsDropdown`; native form selects                                                                                  | Preserve native form controls and Radix Select; classify action menu versus popover by content.                |
| Sticky toolbar        | dashboard, input, chart, course, notes, orders, handoff                                                                                                                       | Extend `StickyToolbar` / `ToolbarSections`; feature actions stay local.                                        |
| Side panels           | input suggestions, clinical chat, chart history, dashboard task sidebar                                                                                                       | Preserve modal mobile suggestions/chat behavior separately from inline desktop asides.                         |
| Bottom panels/actions | chart smart append; orders multi-select action surface; mobile navigation                                                                                                     | Keep bottom sheets distinct from nonmodal action bars and navigation.                                          |
| Page navigation       | `App`, `app/shell/Sidebar`, `NAV_ITEMS`, `ViewState`                                                                                                                          | Share nav item semantics; keep view state and routing decisions with app shell.                                |
| Search                | dashboard, notes, orders, course `ToolbarSearch`; chart/input search controls                                                                                                 | Add labels/clear affordance; feature selectors retain matching and state.                                      |
| Filters               | dashboard, notes, orders toolbars; chart history; date-range fields                                                                                                           | Share composition only; owner rules, counts, retention, and resets stay local.                                 |
| Empty/splash          | shared `EmptyState`, loading screen/startup HTML, feature-specific no-results content                                                                                         | Add compact/page variants; preserve truthful cause-specific copy and actions.                                  |
| Operational tables    | orders diagnostics, medication rows, grouped date headers, selection/bulk actions                                                                                             | Extract structure around existing domain rows; preserve responsive list/card workflow.                         |
| Loading               | app bootstrap/lazy views, LoadingOverlay, lookup, suggestions, chat, AI, prescription and media actions                                                                       | Extend `LoadingFeedback`; preserve pending scope and feature cancellation.                                     |
| Errors                | `ErrorState`, lazy/editor boundaries, app errors, input/chart alerts, feature inline validation/errors                                                                        | Reuse display composition; classification and recovery remain with owner.                                      |

Progress: this map is a baseline, not proof every inline alert/dropdown has been individually audited. The later sweep is required before closure.

## Target architecture and API rules

Follow [repository ownership](../../architecture.md#repository-ownership), the [design system](../../design-system.md), and [verification strategy](../../testing.md).

- **Tokens:** `src/styles/tokens.css` owns shared visual decisions. Reuse existing semantic colors, radii, shadows, spacing scales, typography, focus styles, and motion conventions. Add documented layer/offset/density tokens only where repeated needs justify them.
- **Primitives:** `src/components/ui/` owns generic surfaces, controls, layout, and interaction. Preserve existing names and paths when practical. Add small family folders only when a family needs several related files; avoid speculative barrel exports.
- **Adapters:** `src/components/dialogs/` owns cross-feature dialog compositions. Clinical controls remain in `src/components/clinical/`; orders, medications, chart history, and other workflow adapters stay with their documented owners. Keep existing status adapters until a deliberate ownership cleanup is justified.
- **Composition:** app shell and features supply content, labels, values, callbacks, validation, selected IDs, pending state, and workflow decisions. Shared UI never imports patient records, calls AI, or writes storage.
- **State:** use controlled props for business-relevant state. Local primitives may own ephemeral focus/highlight state. Continue using `ViewState` only for eligible session UI state; preserve its patient identity keys, logout clearing, and deletion clearing.
- **Async presentation:** extend `LoadingFeedback`, `LoadingOverlay`, `createLazyFeature`, and the existing editor fallback. Features supply operation labels, pending state, retained content, safe error messages, and explicit retry/cancel actions. Do not introduce a global loading boolean, generic fetch framework, or mandatory async-state wrapper; shared UI must not start/retry requests or infer cancellation from dismissal.
- **Customization:** prefer typed size, density, intent, placement, and layout variants; slots for header, body, footer, actions, and custom cells; and narrowly scoped class overrides. Avoid flags for individual features and arbitrary overrides that bypass required semantics.
- **Behavior:** document visibility, close-request reasons, focus entry/restoration, modal versus nonmodal behavior, scroll ownership, mount retention, and pending actions. Share behavior through existing accessible foundations rather than copying document listeners into each consumer.
- **Dependencies:** retain Radix Dialog, Select, Popover, and Dropdown Menu. These focused primitives provide distinct dialog, value-selection, anchored-content, and action-menu semantics. Measure production bundle impact; do not add an entire UI/table suite by default.

Proposed conceptual contracts: controlled `open/onOpenChange`; close reasons such as Escape, outside interaction, and close button; semantic `intent`; explicit labels/descriptions; composed header/body/footer; feature-supplied `pending/error`; stable `getRowId`; and separately controlled query/filter/selection values. These are design targets, not a requirement to rename every existing prop. Preserve old call sites with thin, tested adapters during migration and remove adapters when their last consumer moves.

## Compatibility policy

“Do not break existing behavior” means preserving supported user outcomes and data contracts, with targeted tests and reviewed differences. It is not a claim that a plan can guarantee zero regressions.

Before migrating each consumer, record its trigger, content, keyboard shortcuts, dismissal paths, focus destination, save/cancel semantics, callback order/count, draft reset/retention, active patient/entry identity, pending behavior, and mobile layout. Record any accessibility correction or intentional UX adjustment separately from structural extraction. For example, adding focus trapping to a custom modal, changing backdrop dismissal, changing confirmation timing, or replacing simultaneous toasts with a queue is a behavior decision, not invisible cleanup.

Retain exact source strings and values on no-op open/close, navigation, filtering, and presentation changes. Keep generated content visibly reviewable. Use synthetic fixtures only; screenshots and feedback examples must contain no real patient data or credentials.

## Staged execution

### Stage 0 — Complete the inventory and establish regression baselines

Dependencies: none. Risk: low. Deliverable: a consumer inventory and verified baseline in this tracker.

1. Enumerate every consumer in the fourteen families, including inline JSX in large feature files, custom portals, document listeners, `fixed`/`sticky` layers, native selects, loading indicators, skeletons, error boundaries, inline validation, and rich-content exclusions. Assign each to “reuse,” “extend,” “migrate,” or “intentional exception,” with its feature owner.
2. Capture the compatibility contract described above for every interactive surface. Pay particular attention to input drafts, nested camera dialogs, prescription printing, chat state while hidden, and bulk-selection scope.
3. Run the existing lint/typecheck, unit, build, formatting, documentation, and desktop/mobile browser suites before code changes. Record baseline failures honestly and resolve or isolate them before relying on the baseline.
4. Add focused characterization coverage where migration risks are currently uncovered. Assert observable workflows rather than Tailwind class strings or internal state.
5. Capture a small reviewed set of synthetic desktop/mobile reference screens: a dialog, overlapping selector, toolbar/filter region, chat/suggestions, bottom action bar, and diagnostics/medications. Include long content and narrow-screen cases.
6. Reconcile observed stale/duplicated guidance when relevant: architecture currently repeats its view-state paragraph and describes legal-dialog lazy loading, while design guidance describes eager legal-dialog imports. Verify implementation before correcting the authoritative text.

Exit gate: each known consumer has a disposition and compatibility notes; baseline results and critical coverage gaps are recorded.

Progress: source sweep and baseline complete. `npm run typecheck`, `npm run build`, `npm test` (156 tests), `npm run docs:check`, and `npm run test:e2e` (36 passed, 2 skipped across desktop/mobile) passed before code changes. `npm run format:check` already failed on unchanged `tests/brand.test.tsx`. Consumer inventory is being refined as migrations expose remaining special cases.

### Stage 1 — Define shared visual and interaction contracts

Dependencies: Stage 0. Risk: medium because tokens can affect many views.

1. Specify approved compact/default densities, surface sizes, headers/footers, borders, elevations, focus rings, motion durations, disabled/pending appearance, destructive actions, and truncation rules. Preserve clinically meaningful text; provide wrapping or disclosure instead of truncating medication meaning.
2. Define one layer policy covering sticky content, patient header, mobile navigation, nonmodal panels, modal backdrops/content, anchored surfaces inside dialogs, nested dialogs, and feedback. A select inside a dialog must remain above its parent without sitting above an unrelated topmost dialog.
3. Define layout offsets and safe-area ownership. Account for patient header, mobile bottom navigation, bottom actions, chat launcher, virtual keyboard, and toast placement without accumulating arbitrary z-index increases.
4. Specify modal/nonmodal focus rules, topmost Escape handling, trigger restoration with a fallback when the trigger disappears, scroll locking, and hidden-content focus exclusion. Let the accessible foundation handle these where possible; do not build a parallel overlay manager without evidence.
5. Add representative composed examples using synthetic data in existing test/development infrastructure. Include nested and responsive examples. Do not add a new production route or component-gallery dependency solely for this work.
6. Document accepted contracts in `docs/design-system.md` as they are implemented; keep proposed contracts clearly labeled until then.

Exit gate: examples demonstrate brand consistency and layer behavior; token changes have reviewed visual diffs. Required behavior differences are identified explicitly.

Progress: first shared contracts are implemented below. No token or layer-order redesign has been made yet.

### Stage 2 — Consolidate modals and confirmations

Dependencies: Stage 1. Risk: high for focus, drafts, and action timing.

1. Extend `ModalShell` with the minimum needed composition: associated description, explicit close policy, focus hooks where needed, responsive sizing, scrollable body, and independently reachable footer actions. Support title-less visual layouts while requiring an accessible name.
2. Preserve the shell's existing API/defaults during migration. Avoid remounting children merely because layout or breakpoint changes. Make draft retention/reset an explicit consumer responsibility.
3. Keep confirmation semantics distinct from general forms: clear consequence, specific action label, cancel affordance, safe initial focus, destructive intent, and described content. Evaluate alert-dialog semantics for blocking decisions; do not indiscriminately relabel every modal.
4. Preserve existing synchronous confirmation behavior in the compatibility adapter. Add a separate explicit pending/error contract only for consumers that need async confirmation: prevent duplicate submission, close on success according to owner policy, and retain retryable failure. Define cancellation during pending work per workflow.
5. Migrate a simple existing dialog first, then input confirmations and shared confirmations, then prescription/bulk-order/media-heavy surfaces. Migrate smart append with the bottom-sheet stage if needed; do not force it into a centered-only API.
6. Verify no-op source preservation, save/cancel, Escape/outside click, nested dialog/select interaction, submit shortcuts, IME handling, camera cleanup, and prescription print output.

Exit gate: migrated dialogs use the shared foundation without duplicate listeners or changed callback counts; all dismissal and retention differences are documented and tested. Remaining exceptions have explicit owners and migration stages.

Progress: `ModalShell` now supports optional accessible descriptions, center/bottom/right placement, bottom safe-area space, explicit Escape/outside close policies, and a feature-owned overlay class. Existing center defaults remain. `AddOrderModal`, medication approval, camera capture, smart append, legal Terms/Privacy dialogs, and the prescription editor use the shell and preserve their explicit dismissal controls. The legal and prescription dialogs remain open on Escape/outside interaction. Prescription item removal now uses `ConfirmationModal`, preserving its explicit Cancel/Delete choice and editable item on cancel. Bulk Orders is also migrated while retaining backdrop dismissal, Ctrl/Cmd+Enter, and owner-held draft state. Camera device selection, retry, capture, audio dictation, smart-append draft, and merge behavior remain feature-owned. Added placement/description/dismissal tests; broader modal consumers remain.

Confirmation contract: `ConfirmationModal` still calls `onConfirm` once and then `onClose` synchronously; focused tests protect call order and disabled behavior. No async pending contract has been added.

Progress: input reset and clear-history confirmation overlays now use `ConfirmationModal` with Escape/backdrop dismissal disabled to match their previous explicit-choice behavior. Reset still archives the current note as a draft before clearing; history confirmation still deletes only when confirmed. The chart Plan section’s custom delete overlay now uses `ConfirmationModal`, retains explicit-choice dismissal, and deletes only the selected plan item. Its focused component test covers cancel, Escape/backdrop, and confirm behavior. The reset browser journey passes on desktop and mobile.

### Stage 3 — Unify toast, popup, and inline feedback

Dependencies: Stage 1 layer policy; validate interaction with Stage 2. Risk: medium.

1. Define distinct presentations: transient toast for completion/information; persistent actionable error; inline alert for contextual validation/retry; existing browser notification service for its separate delivery channel. Keep errors close to the affected task when possible.
2. Extract a common intent/icon/content/action treatment using brand tokens. Add accessible status/alert announcements according to urgency without announcing the same message twice or stealing focus.
3. Add a single viewport/host if the inventory confirms collision between independent messages. Give messages stable transient IDs, explicit dismissal and lifetime, bounded visible stacking, and optional deduplication keys. Preserve each event unless an explicit replacement policy applies.
4. Bridge current `Toast` callers. Preserve the current five-second default and `duration <= 0` persistence while migrating. Treat changes to stacking, timer restart, hover/focus pause, or deduplication as intentional UX changes with tests. Persistent chart errors must not become transient by default.
5. Position feedback around mobile navigation, bottom actions, active panels, and the virtual keyboard; keep it readable and dismissible while a modal is open. Prevent cross-patient feedback from being misleading after identity changes.
6. Migrate app and feature feedback, then remove duplicated fixed alert markup. Keep notification permission requests and desktop notification behavior in their existing owner.

Exit gate: simultaneous feedback remains reachable, timers clean up, success/error types remain correct, and navigation or unrelated rerenders do not lose or indefinitely prolong messages.

Progress: `ToastProvider`/`useToast` now own one safe-area-aware app viewport with at most four visible messages and FIFO overflow queueing. Toasts retain stable IDs, manual dismissal, the five-second default, and duration-zero persistence; timer lifetime no longer restarts on unrelated rerenders. Errors announce assertively, success/info politely. App generation errors use a stable persistent ID and are dismissed when their workflow clears them. App upload feedback, dashboard, chart status/order feedback, profile, and plan-card success feedback now use the shared host. Browser notifications remain separate. Remaining work: inventory and migrate other context-local popup feedback, verify identity-scoped messages and modal layering on mobile, and remove any duplicate fixed alert markup found in the final sweep. Focused toast/provider and chart-status tests pass; full unit validation passes (179 tests across 61 files). Lint/typecheck, production build, docs check, and `git diff --check` pass.

### Stage 3A — Extend loading, error, and recovery foundations

Dependencies: Stages 1–3. Execute before Stage 4; the suffix preserves existing stage references. Risk: high for cancellation, retained drafts, and stale async results.

1. Inventory loading/error consumers in startup, lazy views, editors, AI generation, lookup/suggestions, chat, photo/media analysis, import/export, storage feedback, and row/form actions. Record real states and transitions: idle, initial pending, refresh with existing content, success with content, success without content, failure with/without retained content, cancellation, and retry. A feature need only implement states it actually supports.
2. Define presentation by scope using current components: `LoadingScreen` for genuine app startup; `LoadingBarIndicator` for view/module loading; `LoadingIndicator` for compact region/action feedback; `Skeleton`/`SkeletonSection` for known pending layouts; and `LoadingOverlay` only where the workflow already requires blocking interaction. Do not replace every spinner with a bar or invent percentage progress when the operation provides none.
3. Extend existing primitives with only proven composition needs: size/density, contextual label, action slot, and region layout. Keep feature-shaped skeletons in their owning feature. Preserve startup's pre-React inline implementation and shared brand source; use static reduced-motion feedback and hide decorative skeletons from assistive technology.
4. Preserve valid content during refresh and keep unaffected chrome/actions usable. Scope `aria-busy` to the affected region, keep status announcements concise, and avoid competing live regions between loader, inline alert, and toast. Do not impose minimum loading delays, remount editors, or show an empty state before a pending operation finishes.
5. Extend `ErrorState` for compact, section, panel, and view compositions as actual consumers require. Distinguish field validation (associated with its input), operation failure (near the failed action), view/module failure (local fallback), and render failure (existing error boundary). Keep storage write failures persistent and truthful about unsaved work; a dismissed alert is not a successful save. Reuse Stage 3 intent/action styling without duplicating notifications.
6. Preserve `createLazyFeature` module caching and explicit retry behavior. Preserve the editor boundary's labelled plain-text fallback and current draft; do not consolidate error boundaries if doing so changes their reset/remount or data-retention contracts. React error boundaries do not handle async/event-handler failures: keep those catches in the workflow/service owner.
7. Keep retry and cancellation explicit and owned by the feature. Retrying a read or failed module import must not automatically replay a write, append, order creation, or AI generation. Record whether Cancel aborts the underlying operation or only stops applying its result. Test late completion after cancel, a newer request, navigation, unmount, or patient/entry change so stale results cannot overwrite the active work. Treat any newly discovered lifecycle defect as an explicit tested fix.
8. Use existing typed errors/message helpers at their current boundary, with reviewed user-facing messages. Do not render raw provider errors, stack traces, clinical prompts/responses, or patient identifiers in shared feedback. Error classification and any safe diagnostics remain outside presentation primitives; do not introduce a universal error-code taxonomy solely for visual reuse.
9. Migrate in small slices: validate existing loading/lazy-view compositions first; pilot shared regional loading/error treatment in lookup or suggestions; migrate other AI/media and form/action feedback; then address blocking overlays and persistence-related messages. Preserve existing cancellation availability and recovery actions. Coordinate panel/table consumers with their later stages.
10. Extend `loading-feedback`, `lazy-feature`, and `editor-error-boundary` tests plus the relevant feature-hook tests. Use controlled promises and synthetic failures to cover immediate/slow completion, first-load failure and retry, warm remount, refresh failure with retained content, duplicate clicks, cancellation, stale completion, and fallback draft retention. Verify focus/announcements and mobile error-action reachability in affected browser journeys.

Exit gate: each inventoried loading/error state has an appropriate shared composition and explicit owner; recovery preserves drafts and valid content; retries cannot silently duplicate mutations; stale completion cannot affect another patient/entry; reduced-motion and accessible feedback pass verification. Do not claim new lifecycle guarantees without tests.

Progress: the existing foundations are reused without adding a competing async framework. `SuggestionsDrawer` renders initial and refresh failures through `ErrorState`, retains its retry path and prior suggestions after refresh failure, and keeps arbitrary provider/configuration error details out of user-facing feedback. Medication approval uses the same shared error treatment for initial and refresh failures. `ErrorState` supports title-free inline alerts with a beside-message dismissal action; chart assistance, input, note dictation, prescription data loading/printing, medical lookup, and camera permission errors now share this presentation while their feature owners retain message and dismissal state. Lookup retry preserves its query, and camera retry remains feature-owned with capture disabled until permission succeeds. Audio transcription failures across intake, chat, note dictation, and smart append now show generic inline recovery guidance without discarding drafts or misrouting retry to chat generation. Smart-append integration failures now appear inside the active modal with the entered draft retained, avoiding reliance on feedback behind the modal layer. Focused tests cover safe transcription/integration feedback and draft retention. Clinical assistance generation failures now show local retry guidance while retaining the current recommendations, with a focused safe-error/content-retention test. Prescription parse failures now explain that the form needs manual review before printing rather than silently presenting a blank medication row. Chat retry stays in its conversation bubble, preserves the failed turn, and is disabled while another response is pending; hook coverage verifies duplicate retry/send prevention and ignores a provider success arriving after cancellation. Chart photo analysis now invalidates pending success and failure results when the selected entry changes or the owner unmounts, and resets its pending indicators; a controlled-promise test covers entry navigation. App-level reassessment and assessment now ignore completion/failure after the active patient, entry, or patient snapshot changes, and duplicate same-tick requests are blocked. Summary refresh is scoped to the active patient snapshot and is invalidated on patient navigation; request-identity tests cover changed identity and a controlled late completion. An App integration test holds reassessment pending, switches to another patient, then resolves the old request and verifies neither record receives the stale update. Settings now shows shared inline feedback when a preference update throws, clears stale saved status when the preference changes, and releases its saved-state timer on unmount. Import parsing retains detailed internal errors, while user feedback now maps malformed JSON, invalid case structure, and read failures to safe guidance without echoing uploaded filenames. Patient-store persistence reports durable-write failure from `safeStorage` and displays a persistent app toast while retaining the existing session-only memory fallback; later successful writes clear the alert. Startup hydration now reports unreadable or malformed patient data and skips the initial write, preserving the original stored value instead of replacing it with an empty list. Intake draft-history and active-session failures remain visible inline until each affected storage path recovers. Default-specialization and chart section-visibility write failures also use persistent shared feedback and clear after recovery. All current `safeStorage.setItem`/`removeItem` consumers inspect write status. Lazy-view coverage verifies first-load failure, explicit retry, warm remount cache reuse, and visible loading status. Editor-boundary coverage verifies a failed enhanced editor leaves the exact draft, including literal escape sequences, editable through the plain-text fallback. Shared loading/error tests check polite status, assertive errors, decorative skeleton hiding, and reduced-motion spinner treatment. The automated Stage 3A suite is clean; hands-on screen-reader and visual checks across dynamic viewport/keyboard states remain outstanding.

### Stage 4 — Consolidate menus, selects, and popovers

Dependencies: Stages 1–2 and 3A. Risk: medium.

1. Classify each surface by purpose: actions use a menu; single values use native select or the existing Radix Select foundation; form-like multi-control surfaces use a popover; searchable choices need a combobox only if a current workflow requires one.
2. Provide shared trigger/content/item/separator styles and behavior while keeping these semantic families separate. Use typed values, explicit labels, disabled states, selected indicators, and icons that do not replace text meaning.
3. Preserve order/medication status adapters and enum values. Improve contextual labels without changing status transitions or clinical color meaning.
4. Migrate input template/history/action menus and chart section management one at a time. Treat drag/reorder or checkbox-heavy management content as a popover composition, not a forced menu-item list.
5. Replace manual geometry/listeners only after verifying viewport collision handling, scroll/reposition behavior, trigger width, long labels, and nested dialog portals.
6. Verify keyboard opening, arrow navigation/typeahead where appropriate, Escape, focus restoration, outside dismissal, touch targets, and row-action event propagation.

Exit gate: no clipping in toolbars/panels/dialogs; selecting a status does not accidentally activate its row; custom positioning remains only for documented special cases.

Progress: added shared Radix-backed `Popover` and `DropdownMenu` surfaces with portal positioning, viewport collision constraints, brand styling, Escape dismissal, and focus restoration. Input Templates and Drafts use the popover; chart section management remains a checkbox popover. Dashboard patient actions, media gallery upload/camera actions, clinical chat attachment actions, and the chart toolbar action surface now use the menu primitive, replacing custom click-away handling while preserving existing workflow callbacks and status/delete confirmation. The gallery menu is portalled into its dialog layer; Escape closes the menu first and preserves the gallery, while a subsequent Escape retains the dialog's existing close behavior. `ToolbarButton` forwards refs and native button props for safe `asChild` composition and supports accessible names for icon-only triggers. Focused menu/popover tests and desktop/mobile chart-management, dashboard-delete, and gallery-menu browser journeys cover interaction and recovery behavior. The clinical chat menu has keyboard opening, Escape, and focus-return unit coverage. The chart toolbar's three menu entries had no action callbacks before migration and remain presentational; implementing those actions is separate feature work. The deep-dive composer in `PatientNoteCard` remains a documented selection-relative popover exception because it embeds chat and recording behavior and accounts for nested dialogs. The production bundle impact of both Radix dependencies remains under review; no size budget has been set.

Latest Stage 4 slice: the dashboard task-sidebar order selector now names its order in the accessible label, matching order-card and medication-row controls. A containment test exposed that choosing a portalled status option bubbled to and activated its parent row; the shared select content now stops that click propagation while retaining its status callback. Focused tests cover both contextual naming and row isolation. `docs/design-system.md` records these contracts. The current production build emits the shared `Popover` chunk at 28.64 kB raw / 10.06 kB gzip and the app entry chunk at 445.17 kB / 138.28 kB gzip. There is no recorded pre-Radix baseline or bundle budget, so these are tracking figures rather than a regression verdict.

Stage 4 exit-gate audit: migrated menu/popover browser journeys cover desktop and mobile positioning, portal layering, dismissal, and focus return. The only remaining custom selection-relative popover is the documented `PatientNoteCard` deep-dive composer, whose selection anchoring and nested chat/recording state do not fit the generic primitive. The final status-selector browser journey passes on desktop and mobile, and a unit test verifies that selecting a portalled option does not activate its containing row. No other custom action-menu or form-popover positioning remains in the source audit.

### Stage 5 — Standardize side panels, bottom sheets, and bottom actions

Dependencies: Stages 1–2 and 4. Risk: high for hidden state and responsive behavior.

Progress: chart smart append now uses `ModalShell` bottom placement, which centers at the larger breakpoint and reserves bottom safe-area space on mobile. Its prior Escape/backdrop non-dismissal, editor draft, microphone actions, and submit callback remain with the feature. A focused test covers placement, dismissal, empty-submit disabling, and callback payload. `SidePanelShell` supports left/right placement for nonmodal panels that keep background workflow available, with a mobile backdrop, named dialog header, close control, panel-owned scrolling, and an opt-in `keepMounted` mode that makes closed content inert. `SuggestionsDrawer` and the mobile chart-history overlay now compose through it; chart history keeps its inline desktop aside and feature-owned search, filters, navigation, and selection behavior. `ChatPanel` retains its conversation and composer draft across close, its desktop resize handle and width, independent message scrolling, pinned composer, audio state owner, and nested camera modal. Focused tests cover left/right shell dismissal, default unmount, and inert retained content; offline desktop/mobile journeys verify suggestions error/close behavior and chat draft/focusability across close and reopen. The orders multi-select bar now sits above mobile navigation and safe-area space and conditionally increases list padding so the final row can scroll clear of the bar. A synthetic six-row desktop/mobile browser journey verifies final-row and navigation clearance and repeats the checks after landscape and reduced-height viewport changes. Physical-device keyboard behavior remains outstanding.

1. Share panel header/body/footer and surface styling. Offer explicit compositions for inline complementary panels, nonmodal overlay panels, and modal drawers. Reuse the dialog foundation for modal side/bottom placements.
2. Migrate suggestions first. Preserve its existing breakpoint behavior, result/error state, generation triggers, and review flow. Do not make desktop background content inert if the current workflow requires it to stay usable.
3. Migrate chat after suggestions. Preserve mounted conversation state, composer/attachments, resize limits, auto-scroll, keyboard submit, and nested camera workflow. Ensure offscreen closed controls cannot receive focus. Keep its resize hook feature-owned unless another real consumer needs it.
4. Normalize chart history and dashboard task-panel presentation where contracts fit; preserve inline layout, independent scrolling, collapse, and history navigation. Do not add a backdrop/focus trap to ordinary asides.
5. Migrate smart append into a responsive modal surface that is a bottom sheet on small screens and centered where appropriate. Preserve exact appended content and owner-controlled submission/cancellation.
6. Extract `BottomActionBar` for orders multi-selection separately from `BottomSheet`. Preserve the current visibility threshold and selected-ID scope. Keep the bar nonmodal, and ensure it does not cover the final row or mobile navigation.
7. Test safe-area padding, dynamic viewport height, keyboard opening, orientation changes, long scroll regions, nested layers, reduced motion, and cleanup of resize/listener/media resources. Add keyboard resizing only as an explicit accessibility improvement with bounds and tests.

Exit gate: mobile/desktop transitions retain drafts and selected IDs; no focusable hidden panel content; every panel has an explicit modality, scroll owner, and mount policy.

### Stage 6 — Consolidate sticky toolbars, search, and filters

Dependencies: Stages 1, 3–5. Risk: medium; matching/state preservation is critical.

1. Extend existing toolbar composition into clear start/end action groups, count/status area, search slot, expandable filter region, separators, and overflow behavior. Preserve view-specific actions and their order.
2. Replace repeated sticky offsets with the Stage 1 layout contract. Keep essential actions reachable at narrow widths through deliberate wrapping/scroll/overflow rules; do not hide primary actions indiscriminately in menus.
3. Extract or evolve a generic `SearchField` from `ToolbarSearch`: controlled value, explicit accessible label, placeholder, clear action, optional pending indicator, and disabled state. Keep the toolbar wrapper as an adapter until callers migrate.
4. Keep matching and query normalization in existing feature selectors. Do not add debounce, fuzzy matching, or query trimming unless current behavior calls for it. Preserve immediate typing, IME behavior, search decoration, and patient-scoped retained state.
5. Compose `FilterBar`, an accessible expand/collapse trigger, reusable filter fields, `DateRangeFields`, count, and reset affordance. Add active-filter chips only where useful and with tested removal/reset semantics. Avoid a schema-driven filter engine.
6. Preserve each view's date boundaries, AND/OR rules, status/category defaults, sorting, count meaning, and page-reset behavior. A hidden filter region must not silently clear active values. Do not impose one meaning of “active count” without checking the owner.
7. Pilot on notes, then dashboard and orders, then chart/input/course/handoff toolbar compositions. Retain specialized controls where abstraction would obscure their workflow.

Exit gate: identical fixtures produce identical ordered results before/after migration; clear/reset and navigation retention match existing contracts; search and filter controls remain labelled on mobile.

Progress: extracted `SearchField` with controlled value, explicit label, optional caller-owned clear action, pending indicator, and disabled state; `ToolbarSearch` now adapts it for sticky toolbars without changing consumer query behavior. Dashboard, notes, orders, and course provide labels and clear behavior; course resets pagination when cleared. Filter toggles expose `aria-expanded` and connect to existing dashboard/notes/orders panels. Matching, filtering, and retained state remain in feature owners.

Latest Stage 6 slice: chart-history search now uses the shared `SearchField` with an explicit label and clear action, retaining the existing immediate matching and page-reset behavior. Its compact filter control uses `ToolbarFilterToggle` with a contextual accessible name and correctly targets separately identified desktop and mobile filter regions. The toolbar filter toggle now also has a safe “Filters” fallback accessible name, with contextual names supplied by dashboard, notes, orders/medications, course, and chart history where their text labels collapse on mobile. Focused tests protect the shared toggle semantics, and desktop/mobile browser journeys verify the chart-history search and filter controls. A source audit confirms the dashboard, notes, orders, and course search/filter toolbars use the shared adapters; remaining input/chart workflow searches retain feature-specific form structure where submit and focus ownership require it.

Stage 6 exit audit: the shared search field and filter toggle are used across dashboard, notes, orders, course, and chart history. Search matching, clear/reset, pagination, and feature-owned filter rules remain local; active filter counts retain their existing meanings. Mobile icon-only filter triggers have accessible names, and chart history’s desktop and mobile filter controls target separate regions. Focused tests and desktop/mobile chart-history browser journeys pass. Stage 6 is complete; the remaining input lookup form is intentionally a submit-oriented workflow with autofocus and pending-submit ownership rather than a toolbar search control.

### Stage 7 — Align page navigation and empty/loading/splash states

Dependencies: Stages 1 and 6; verify against migrated panels. Risk: medium to high for remounts.

Progress: desktop and mobile sidebar navigation landmarks now have distinct accessible names. The desktop collapse affordance is a labelled button with expanded state and a connection to the primary navigation region, replacing the pointer-only stripe interaction. All page destinations, including Settings, now compose through `ViewNavigationItem` across both layouts. Patient-specific destinations use a labelled Patient sections navigation landmark and expose the active view as the current page. The desktop/mobile browser round-trip verifies keyboard activation and focus retention, preserves the patient heading and patient-scoped Orders search across Chart → Orders → Chart, restores the Chart scroll position, and returns to the same chart content. Course timeline no-results uses the shared compact `EmptyState` with its feature-specific cause message and existing filter controls. The remaining input-history and chart-history empty messages are documented dense panel/list contexts.

Stage 7 exit audit: lazy view loading/retry and local error recovery are covered by `lazy-feature.test.tsx`; startup loading is covered by the bootstrap browser journey; legal policy content and acknowledgment dismissal are covered by `legal-policy-modals.test.tsx`. The Chart → Orders → Chart browser journey passes on desktop and mobile with keyboard navigation, patient-scoped search retention, scroll restoration, and focus retention. Empty collection and no-match states retain their owner-specific copy and actions. Stage 7 is complete; hands-on screen-reader and dynamic viewport review remains part of the final cross-stage release gate.

1. Share navigation-item presentation and state between desktop sidebar and mobile navigation using the existing `NAV_ITEMS` and `ViewMode`. Keep orchestration in `App` and shell modules.
2. Distinguish page navigation, within-page tabs, and pagination semantically. Supply active/current indicators, accessible icon-only names, disabled semantics where applicable, and keyboard-operable collapse controls. Do not install a router or invent browser-history/deep-link behavior as part of this extraction.
3. Preserve patient selection and active entry while navigating among patient-specific views, lazy module reuse, retry, scroll restoration, view-state identity keys, and logout/deletion cleanup. Keep the existing policy that leaving for a non-patient destination clears the active patient and entry. Verify focus management on actual navigation without resetting focus on ordinary rerenders.
4. Extend `EmptyState` for compact/section/page presentation and optional actions. Keep distinct feature copy and actions for no records, no patient selected, no matching results, and completed work.
5. Apply Stage 3A loading/error contracts to navigation and page framing. Preserve existing valid content during refresh; do not skeletonize already-hydrated local records or remount the full shell. Verify that a failed view remains a local recoverable error, not an empty page or a full-app failure.
6. Keep startup HTML lightweight and independent of React. Retain its brand source and reduced-motion loading treatment. Login/access stays a feature composition; do not introduce a new public splash/landing route.
7. Migrate repeated empty markup and page framing only after checking the associated add/import/clear-filter/retry actions.

Exit gate: navigation round trips restore the same patient context, controls, and scroll; empty versus filtered versus loading states are accurate; startup/legal-dialog behavior remains intact.

Progress: added a shared `ViewNavigationItem` for desktop sidebar/mobile bottom navigation with `aria-current="page"` and accessible collapsed/icon-only labels. `EmptyState` offers compact and page variants, optional descriptions, and owner-provided actions. Notes and dashboard empty/no-match states now compose through it while retaining their distinct copy and add/reset actions. Automated route round-trip and visual regression checks are still pending.

### Stage 8 — Extract reusable operational table/list composition

Dependencies: Stages 3–7. Risk: highest because editable clinical rows combine many interactions.

Progress: the responsive surface frame is shared by diagnostics and medications. Their row components, column layouts, status adapters, grouping, selection state, and bulk workflows remain feature-owned because the contracts differ. Medication and diagnostic empty views now compose through `EmptyState`; its footer slot preserves the diagnostics workflow’s two distinct add actions. Medication selection controls announce the medication and selected state, and edit/delete actions have explicit names. Diagnostic selection controls likewise announce the order and selected state; date-group completion toggles expose their target date and pressed state. Both editors associate visible captions with controls, give notes explicit accessible names independent of placeholders, and focus only the primary field on entry. Closed editors refresh their drafts when row props change, while open drafts remain untouched. Medication Save/Cancel and diagnostic Save return focus to their contextual edit actions; medication Cancel resets its draft. Selection remains intact when filtering hides selected rows, but deleted IDs are pruned and patient changes clear selected IDs and close patient-specific order surfaces. A grouping test verifies that only selected diagnostic IDs are grouped, the selected set receives the latest target date, and unselected orders retain their date and group state. The responsive and medication bulk-action characterization is complete in the latest Stage 8 slice below.

Latest Stage 8 slice: diagnostic edit, delete, and ungroup actions now have record-specific accessible names; all editor captions label their controls. Diagnostic editing focuses the order name without a competing notes-editor autofocus, restores focus after save, and retains the exact target timestamp and other values when unchanged. Both editors refresh closed drafts from updated row values to prevent later saves from overwriting a status changed through its row selector; an open draft remains feature-owned. Orders selection is patient-scoped, prunes individually deleted records, and remains stable when filtering hides selected rows. Diagnostic grouping keeps selected IDs only, assigns the existing latest selected target date, and leaves unselected records unchanged. Desktop/mobile browser journeys confirm status edit-save preservation and selected-row deletion cleanup while keeping bottom actions clear of the final row and mobile navigation. Medication bulk deletion now has matching unit and desktop/mobile browser coverage: the confirmation states the selected count, only selected IDs are removed, and unselected dose/route/frequency/duration/notes remain intact. Responsive checks confirm both diagnostic and medication selection controls and the action bar are usable on mobile; the bottom action bar remains above navigation and the final row. A 250-row synthetic browser journey records navigation-to-list and filter timings on desktop and mobile; latest observations were 2067 ms to open diagnostics and 212 ms to filter diagnostics plus 176 ms to filter medications at 1280px, and 2066 ms, 240 ms, and 123 ms respectively at 393px. These are a first operational-list baseline: Stage 0 did not record equivalent order/medication timings, so no before/after claim or threshold is set. The Stage 8 automated exit gate is complete; hands-on physical-device checks remain in the project-wide final gate.

1. Characterize both diagnostics and medication rows before extraction: full displayed fields, editing/save/cancel, focus, statuses, date groups, group links, selection, bulk actions, newly added row focus, deletion, and responsive cards.
2. Separate neutral structure from domain rows: shared surface/scroll region, column headers, cells, row actions, selection controls, empty/loading treatment, and optional group headers. Keep diagnostics and medication editors/adapters feature-owned.
3. Use stable entity IDs for keys and selection; never array indexes. Keep domain filtering/grouping/sorting in existing selectors. Provide typed column definitions/custom cells only where both consumers benefit; do not require every row to fit a configuration object.
4. Choose semantics deliberately: use native table markup when the desktop structure supports it, or retain a well-labelled responsive list composition when it does not. Do not add ARIA grid without implementing its keyboard model. Avoid simultaneously accessible hidden desktop/mobile copies and duplicate editor IDs.
5. Migrate medications as the first vertical slice, then diagnostics with date grouping and group actions. Keep exact dose/route/frequency/duration/sig values, status enums, target dates, and notes; avoid new formatting or truncation that changes meaning.
6. Define and preserve selection under filtering, tab changes, patient changes, deletion, and bulk operations. Make visible-versus-all selection scope explicit; never silently expand the records affected by a bulk action.
7. Verify status dropdown portals, row-click propagation, editor focus across updates, mobile card labels, wide content, keyboard access, and bottom-action clearance. Preserve prescription and export outputs.
8. Measure representative large synthetic lists before/after. Optimize only demonstrated regressions; virtualization, additional paging, and table-engine dependencies require a separate need and focused plan.

Exit gate: medications and diagnostics share appropriate structural primitives while retaining their distinct workflows; no lost edits, changed group membership, altered values, or unstable selection.

### Stage 9 — Finish migration, harden, and document ownership

Dependencies: all previous stages. Risk: broad integration.

1. Revisit the Stage 0 inventory. Every consumer must use the accepted primitive or have a documented intentional exception. Remove obsolete markup, styles, listeners, imports, and compatibility wrappers after their final consumers migrate.
2. Review interaction combinations: toast plus modal; select inside modal; nested camera in chat; sticky toolbar plus filter popover; mobile navigation plus bottom actions; navigation during pending AI work; patient switch with open editing surfaces.
3. Run the complete verification gate below. Inspect affected desktop/mobile views with synthetic fixtures and review intentional screenshot differences; never blanket-update snapshots to suppress failures.
4. Update `docs/design-system.md` with APIs/examples and when to use each family; update `docs/architecture.md` for actual ownership changes, `docs/product.md` for intentional behavior changes, and `docs/testing.md` for durable new verification expectations.
5. Record bundle/performance comparisons, accepted exceptions, and remaining separately scoped work. Move this same tracker to `docs/work/done/` only after all acceptance criteria and required checks pass.

Exit gate: no incomplete migration facades, no unexplained behavioral differences, and all required checks passing.

Progress: Stage 8 is complete. The Stage 9 source sweep confirms modal semantics are centralized in `ModalShell`; nonmodal side panels use `SidePanelShell`; the app toast host is the only direct `Toast` consumer; mobile navigation and bulk actions have named shared compositions; and feature-owned inline recovery remains with its workflow. The selection-relative composer in `PatientNoteCard` remains the documented popover exception. `SoapView` retains a dismissible fixed `ErrorState` for chart integration actions so recovery stays scoped to the active chart; it is separate from transient toast feedback. Interaction-combination coverage now verifies a persistent notification survives a modal, the nested camera dialog correctly hides/restores the chat panel while preserving its draft, and mobile navigation remains clear of selected-row actions. The sweep also found duplicate ViewState guidance in `docs/architecture.md`, duplicate filter-retention guidance in `docs/design-system.md`, and stale legal-dialog loading wording; these were corrected against `App.tsx`. Unused exports reported by Knip were removed without changing runtime behavior.

Stage 9 validation: `npm run check:bundle-size` passes (production startup JS 639.05 kB raw / 199.01 kB gzip, app entry 444.76 kB / 138.32 kB gzip, and largest chunk 448.45 kB under the configured 500 kB limit). No pre-Radix startup baseline or agreed budget exists, so these remain tracking values. Visual review localized the stable 149-pixel dashboard snapshot difference to the current inactive Settings navigation color; the single reviewed macOS baseline was updated and its screenshot comparison now passes. Hands-on screen-reader and physical-device checks for keyboard, zoom, touch, safe-area, and dynamic viewport behavior are outstanding.

## Verification and release gates

For every implementation slice, run focused component/domain tests and the relevant offline browser workflow, plus `npm run typecheck` and `npm run build`. When documentation changes, also run `npm run docs:check` and `npm run format:check`. Broaden shared-foundation changes to the full unit suite.

Final gate: `npm run lint`, `npm run format:check`, `npm run docs:check`, `npm test`, `npm run build`, and `npm run test:e2e`. Use `npm run check:bundle-size` and `npm run check:dead-code` to assess new dependencies and final cleanup; investigate changes rather than treating a raw reduction as success.

Required behavioral evidence:

- **Overlays:** Tab/Shift+Tab, Escape at the top layer only, outside click policy, focus restoration, absent triggers, nested portals, long content, scroll locking, and background accessibility appropriate to modality.
- **Feedback:** simultaneous messages, correct intent, one announcement, timed/persistent lifetime, pause/dismiss behavior if introduced, and timer cleanup.
- **Loading/recovery:** initial load versus refresh, retained content after failure, successful empty results, failed import retry, warm lazy reuse, editor fallback draft retention, cancel/late-completion races, identity changes, safe error messages, persistent unsaved-work feedback, and no automatic replay of mutations. Confirm busy scope, reduced motion, and no duplicate announcements.
- **Controls:** menu/select keyboard interaction, field labels, clear/reset, disabled/pending actions, duplicate-submit prevention, and IME-safe shortcuts.
- **Layout:** desktop/mobile projects plus manual narrow viewport, zoom, virtual-keyboard, touch, safe-area, reduced-motion, and screen-reader spot checks. Automated DOM tests do not establish these on their own.
- **Navigation/state:** view revisits, patient switches, entry switches, filter/page/scroll retention, lazy retry, hidden panel mounting, logout, and patient deletion.
- **Clinical/data:** synthetic no-op/edit/cancel fixtures, exact original text and units, stable IDs, bulk action scope, attachment lifecycle, browser reload, import/export round trips, and unchanged AI review/edit workflows. Run relevant persistence and AI contract suites if those boundaries are touched; stop to reassess scope if a migration needs to change them.
- **Performance:** compare initial/lazy bundle sizes and representative large-list interactions against Stage 0. Agree any numeric budget from measured baseline before adopting it; no invented performance target in this plan.

Existing suites are starting points, not proof that every scenario is covered. Add focused confirmation, toast, menu, panel, toolbar/filter, and operational-row tests as those contracts are introduced; extend Playwright journeys only where end-to-end interactions materially protect workflows. Never make live provider requests in verification.

## Delivery sequence and rollback

Execute stages in the stated order unless the tracker records a justified dependency change. Keep each reviewable change to one foundation or one family/feature migration: foundation plus pilot, then remaining consumer batches, then cleanup. Stage 8 should have separate medication and diagnostics slices.

Each change description must name migrated consumers, preserved contracts, intentional behavior differences, verification, and exceptions. Do not combine unrelated clinical logic cleanup with presentation extraction.

Prefer backwards-compatible component props and incremental consumer migration over runtime feature flags. A failing pilot blocks wider adoption. Revert the affected slice while keeping compatible foundations if appropriate; no storage rollback should be required because this work does not change persisted schemas. Retest the original workflow after rollback. Never leave two competing public component APIs indefinitely.

## Acceptance criteria

- [ ] All fourteen families have an accepted reusable composition, or a justified existing primitive/exception; all inventoried consumers are accounted for.
- [ ] Loading/error compositions extend existing foundations, distinguish initial load/refresh/empty/failure/cancel states, and preserve content, drafts, safe recovery, and patient/entry isolation.
- [ ] Shared UI owns presentation and interaction only; domain, persistence, AI, and feature workflow ownership remain intact.
- [ ] Variants, slots, labels, focus, layers, responsive behavior, and pending/error policies are documented and consistently applied.
- [ ] Clinical text/units, stable IDs, source context, save/cancel, attachments, and import/export behavior are preserved.
- [ ] Search/filter results, selection scope, grouping, navigation retention, and hidden-panel state match recorded contracts.
- [ ] All intentional accessibility/UX changes are recorded and verified separately from extraction.
- [ ] Desktop/mobile workflows and required code/documentation checks pass; visual and performance comparisons are reviewed.
- [ ] Obsolete duplication and migration adapters are removed; intentional exceptions have an owner and reason.
- [ ] Authoritative documentation reflects implemented facts, and this tracker moves to `done/` only when the implementation is complete.

## Progress

Implementation active. Stage 0 baseline and Stages 1–8 are complete. The Stage 9 source and interaction-combination sweep, bundle/dead-code review, and automated desktop/mobile gates are complete. Shared composition, feature ownership, clinical values, drafts, and patient-scoped selection remain covered by unit and offline browser workflows. The 250-row Orders journey establishes an operational-list baseline because Stage 0 contains no comparable order/medication timing. The remaining release evidence is hands-on screen-reader and physical-device review for keyboard, zoom, touch, safe-area, and dynamic viewport behavior.

## Decisions

- Extend existing foundations instead of replacing the UI stack.
- Preserve workflow ownership and separate modality, feedback channels, selection semantics, and operational versus rich-content tables.
- Extend existing foundations and keep shared presentation separate from workflow logic.
- Update `docs/design-system.md` alongside implemented shared contracts.
- Migrate `AddOrderModal` and Bulk Orders to Radix-backed `ModalShell`, with explicit close policies preserving their previous dismissal behavior.
- Keep view navigation on the existing in-app state model and add shared semantics at the item level.

## Verification

- Current full unit suite: `npm test -- --maxWorkers=1` passes 80 files / 235 tests, including the persistent-toast/modal interaction test. A default parallel run timed out 5 tests at Vitest's 5-second per-test limit under worker contention (76 files / 229 passed); the controlled single-worker run is authoritative.
- Current offline browser suite: `CI=true npm run test:e2e` passes 54 desktop/mobile tests with 2 skips; the expanded chat/camera journey passes on both projects. The reviewed dashboard screenshot was updated and its exact macOS comparison passes (1 test).
- Medication bulk-action coverage passes for exact selected-only deletion and preserved unselected medication values. Orders large-list browser timing also passes at both responsive widths; these measurements are current baselines and not before/after claims.
- The expanded chat workflow passes on desktop/mobile with the camera modal nested above the retained chat drawer; closing the modal restores the drawer and its draft. The toast/modal unit interaction also passes.
- `npm run lint` (including typecheck), `npm run build`, `npm run docs:check`, `npm run format:check`, `git diff --check`, `npm run check:bundle-size`, and `npm run check:dead-code` passed after the current changes.

- Latest controlled single-worker `npm test`: 79 files and 228 tests passed, including sidebar, PatientHeader, course empty-state, and medication editor value-preservation coverage.
- `npm run lint` (including typecheck) and `npm run build` pass after the PatientHeader semantics change. The Chromium sidebar-collapse smoke journey and the new desktop/mobile patient-section round-trip both pass (2 tests).
- `npm run test:e2e` passes 44 desktop/mobile tests with 2 skipped. This run includes startup loading, chart/editor workflows, and the responsive journeys; Playwright reports the long-note performance measurements at desktop and mobile widths.
- The status-selector desktop/mobile browser journey also passes separately after the row-propagation fix (2 tests).
- The new orders bottom-action desktop and mobile browser journeys pass, confirming the final record remains visible above the action bar and that the mobile bar clears bottom navigation.
- `npm run build:test` succeeds; the new synthetic 250-row Orders journey passes on desktop and mobile and records first-run open/filter timings. Stage 0 lacks comparable operational-list measurements, so this establishes a current baseline only.
- Medication selection and bulk-delete unit coverage passes, preserving exact values for the unselected record; the responsive medication bulk-action journey passes in desktop Chromium and the mobile project.
- `npm run docs:check`, `npm run format:check`, and `git diff --check` pass after the Stage 7 tracker and test updates.
- An initial attempt to run all expensive checks concurrently caused worker contention and timeouts in unrelated suites; the serial unit and browser runs above are the authoritative results.
- Automated reduced-motion class, live-region, and fallback-draft assertions pass. Hands-on screen-reader review and visual checks while the mobile keyboard/dynamic viewport changes remain outstanding.

## Outcome

Implementation remains in progress. Stages 0–8 and Stage 9 code, documentation, and automated verification are complete. The tracker remains active until hands-on assistive-technology/device checks and final acceptance review are recorded.
