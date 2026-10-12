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
- **Dependencies:** retain Radix Dialog and Select. At the relevant stage, evaluate small matching accessible menu/popover/alert-dialog primitives if installed capabilities cannot support the required semantics. Check current official APIs, licensing, maintenance, and measured bundle impact before adding a dependency. Do not add an entire UI/table suite by default.

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

Progress: `ModalShell` now supports optional accessible descriptions, center/bottom/right placement, bottom safe-area space, explicit Escape/outside close policies, and a feature-owned overlay class. Existing center defaults remain. `AddOrderModal`, medication approval, camera capture, and smart append are migrated and explicitly retain their prior backdrop/Escape dismissal behavior. Bulk Orders is also migrated while retaining backdrop dismissal, Ctrl/Cmd+Enter, and owner-held draft state. Camera device selection, retry, capture, audio dictation, smart-append draft, and merge behavior remain feature-owned. Added placement/description/dismissal tests; broader modal consumers remain.

Confirmation contract: `ConfirmationModal` still calls `onConfirm` once and then `onClose` synchronously; focused tests protect call order and disabled behavior. No async pending contract has been added.

### Stage 3 — Unify toast, popup, and inline feedback

Dependencies: Stage 1 layer policy; validate interaction with Stage 2. Risk: medium.

1. Define distinct presentations: transient toast for completion/information; persistent actionable error; inline alert for contextual validation/retry; existing browser notification service for its separate delivery channel. Keep errors close to the affected task when possible.
2. Extract a common intent/icon/content/action treatment using brand tokens. Add accessible status/alert announcements according to urgency without announcing the same message twice or stealing focus.
3. Add a single viewport/host if the inventory confirms collision between independent messages. Give messages stable transient IDs, explicit dismissal and lifetime, bounded visible stacking, and optional deduplication keys. Preserve each event unless an explicit replacement policy applies.
4. Bridge current `Toast` callers. Preserve the current five-second default and `duration <= 0` persistence while migrating. Treat changes to stacking, timer restart, hover/focus pause, or deduplication as intentional UX changes with tests. Persistent chart errors must not become transient by default.
5. Position feedback around mobile navigation, bottom actions, active panels, and the virtual keyboard; keep it readable and dismissible while a modal is open. Prevent cross-patient feedback from being misleading after identity changes.
6. Migrate app and feature feedback, then remove duplicated fixed alert markup. Keep notification permission requests and desktop notification behavior in their existing owner.

Exit gate: simultaneous feedback remains reachable, timers clean up, success/error types remain correct, and navigation or unrelated rerenders do not lose or indefinitely prolong messages.

Progress: `Toast` now exposes error messages as assertive alerts and success/info messages as polite statuses. Existing lifetime/placement behavior is unchanged. Centralized viewport/queue and consumer migration remain.

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

Progress: the existing foundations are reused without adding a competing async framework. `SuggestionsDrawer` now renders initial and refresh failures through `ErrorState`, retaining its retry action and previously generated suggestions on refresh failure. Medication approval uses the same shared error treatment for initial and refresh failures. Feature-owned request IDs, cancellation/stale-result guards, skeletons, and pending indicators remain in place. Other AI/media/chat/import/storage failure paths still need inventory and migration.

### Stage 4 — Consolidate menus, selects, and popovers

Dependencies: Stages 1–2 and 3A. Risk: medium.

1. Classify each surface by purpose: actions use a menu; single values use native select or the existing Radix Select foundation; form-like multi-control surfaces use a popover; searchable choices need a combobox only if a current workflow requires one.
2. Provide shared trigger/content/item/separator styles and behavior while keeping these semantic families separate. Use typed values, explicit labels, disabled states, selected indicators, and icons that do not replace text meaning.
3. Preserve order/medication status adapters and enum values. Improve contextual labels without changing status transitions or clinical color meaning.
4. Migrate input template/history/action menus and chart section management one at a time. Treat drag/reorder or checkbox-heavy management content as a popover composition, not a forced menu-item list.
5. Replace manual geometry/listeners only after verifying viewport collision handling, scroll/reposition behavior, trigger width, long labels, and nested dialog portals.
6. Verify keyboard opening, arrow navigation/typeahead where appropriate, Escape, focus restoration, outside dismissal, touch targets, and row-action event propagation.

Exit gate: no clipping in toolbars/panels/dialogs; selecting a status does not accidentally activate its row; custom positioning remains only for documented special cases.

Progress: the chart section manager remains a checkbox popover, but its category accordions now use labelled native buttons with `aria-expanded`/`aria-controls`; “Show all”/“Hide all” actions have contextual accessible names and are visible on keyboard focus. Visibility remains controlled by the existing per-entry owner. Other feature menus and custom positioning remain to be migrated or dispositioned.

### Stage 5 — Standardize side panels, bottom sheets, and bottom actions

Dependencies: Stages 1–2 and 4. Risk: high for hidden state and responsive behavior.

Progress: chart smart append now uses `ModalShell` bottom placement, which centers at the larger breakpoint and reserves bottom safe-area space on mobile. Its prior Escape/backdrop non-dismissal, editor draft, microphone actions, and submit callback remain with the feature. A focused test covers placement, dismissal, empty-submit disabling, and callback payload. Suggestions/chat panels and the remaining panel inventory are still outstanding.

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

Progress: `ToolbarSearch` now requires no consumer changes but accepts an explicit accessible label and optional caller-owned clear action. Dashboard, notes, orders, and course provide labels and clear behavior; course resets pagination when cleared. Filter toggles expose `aria-expanded` and connect to existing dashboard/notes/orders panels. Matching, filtering, and retained state remain in feature owners.

### Stage 7 — Align page navigation and empty/loading/splash states

Dependencies: Stages 1 and 6; verify against migrated panels. Risk: medium to high for remounts.

1. Share navigation-item presentation and state between desktop sidebar and mobile navigation using the existing `NAV_ITEMS` and `ViewMode`. Keep orchestration in `App` and shell modules.
2. Distinguish page navigation, within-page tabs, and pagination semantically. Supply active/current indicators, accessible icon-only names, disabled semantics where applicable, and keyboard-operable collapse controls. Do not install a router or invent browser-history/deep-link behavior as part of this extraction.
3. Preserve patient selection, active entry, lazy module reuse, retry, scroll restoration, view-state identity keys, and logout/deletion cleanup. Verify focus management on actual navigation without resetting focus on ordinary rerenders.
4. Extend `EmptyState` for compact/section/page presentation and optional actions. Keep distinct feature copy and actions for no records, no patient selected, no matching results, and completed work.
5. Apply Stage 3A loading/error contracts to navigation and page framing. Preserve existing valid content during refresh; do not skeletonize already-hydrated local records or remount the full shell. Verify that a failed view remains a local recoverable error, not an empty page or a full-app failure.
6. Keep startup HTML lightweight and independent of React. Retain its brand source and reduced-motion loading treatment. Login/access stays a feature composition; do not introduce a new public splash/landing route.
7. Migrate repeated empty markup and page framing only after checking the associated add/import/clear-filter/retry actions.

Exit gate: navigation round trips restore the same patient context, controls, and scroll; empty versus filtered versus loading states are accurate; startup/legal-dialog behavior remains intact.

Progress: added a shared `ViewNavigationItem` for desktop sidebar/mobile bottom navigation with `aria-current="page"` and accessible collapsed/icon-only labels. `EmptyState` now offers compact and page variants while retaining its section default and owner-provided actions. Automated route round-trip and visual regression checks are still pending.

### Stage 8 — Extract reusable operational table/list composition

Dependencies: Stages 3–7. Risk: highest because editable clinical rows combine many interactions.

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

Implementation active. Stage 0 baseline is complete. Shared modal, toast announcement, search/filter, navigation, empty-state, loading/error, bottom action, responsive table-surface, and status-label contracts have started. The current implementation slice passes full unit/build/docs/E2E checks; remaining consumers and families still need the staged migrations below.

## Decisions

- Extend existing foundations instead of replacing the UI stack.
- Preserve workflow ownership and separate modality, feedback channels, selection semantics, and operational versus rich-content tables.
- Extend existing foundations and keep shared presentation separate from workflow logic.
- Update `docs/design-system.md` alongside implemented shared contracts.
- Migrate `AddOrderModal` and Bulk Orders to Radix-backed `ModalShell`, with explicit close policies preserving their previous dismissal behavior.
- Keep view navigation on the existing in-app state model and add shared semantics at the item level.

## Verification

- Baseline before code changes: typecheck, build, 156 unit tests, docs check, and 36 desktop/mobile E2E tests passed (2 skipped). Full format check failed on existing formatting in `tests/brand.test.tsx`.
- Focused modal/confirmation/camera/smart-append tests passed (11 tests); focused menu-popover test passed (1 test). The chart section-visibility and order/medication status Playwright journeys passed on desktop and mobile (4 tests).
- Latest full `npm test`: 60 files, 175 tests passed. Latest `npm run build`, `npm run lint`, and `npm run docs:check` passed after smart-append migration. The full E2E suite passed before adding the chart section test (36 passed, 2 skipped); the new chart section journey passed in both desktop/mobile projects.
- `npm run format:check` remains blocked by the pre-existing formatting issue in unchanged `tests/brand.test.tsx`; changed files are formatted individually.
- `git diff --check` passed after the latest slice. The full acceptance sweep and manual responsive, keyboard, focus, reduced-motion, and screen-reader checks remain outstanding.

## Outcome

Implementation is in progress; acceptance criteria remain open.
