# Design system and UI conventions

## Visual foundation

ClinSight uses Tailwind CSS v4, semantic CSS variables in `src/styles/tokens.css`, shared React primitives, Lucide icons, Motion, and Radix Dialog and Select behavior. `src/styles/globals.css` imports the token and Tailwind layers and owns global typography, scrollbars, and motion helpers. `index.html` loads Inter.

The light theme defines canvas, surface, content, border, action, focus, clinical status, radius, and card-shadow tokens. Tailwind exposes them as utilities such as `bg-canvas`, `text-content-primary`, `border-border-default`, `bg-action`, and `rounded-control`. Semantic color ramps preserve the previous Tailwind values under ClinSight names (`neutral`, `action`, `danger`, `critical`, `warning`, `info`, `pending`, `success`, `attention`, and `accent`), so existing clinical/status distinctions remain stable while their values are centrally managed. Application JSX no longer uses the former palette names. Use semantic utilities for all new or changed UI.

Spacing and typography use Tailwind's shared spacing and type scales; do not add one-off values when an existing scale fits. Use the semantic radius and shadow tokens for shared controls and cards. Workflow-specific dimensions remain local where they express layout constraints rather than design language.

Clinical information must remain readable and statuses distinct. Preserve meaningful medical formatting, numbers, and units in editable text, Markdown, print, and clipboard views. Use the existing Clinical Markdown renderer for source-aware rendering.

## Component ownership and reuse

- Generic controls belong in `src/components/ui/`. Use `Button`, `Badge`, `TextInput`, `TextArea`, `FieldLabel`, status selectors, toolbar controls, file-upload controls, and empty states where their contracts fit.
- Shared dialogs live in `src/components/dialogs/` and compose through `ModalShell`. Dialog focus, Escape handling, and close behavior use Radix Dialog. Status selectors use Radix Select, while order and medication status meanings remain in their feature/domain adapters.
- Clinical Markdown and chat input live in `src/components/clinical/`; keep source references and clinical workflow semantics there.
- Feature-specific views and components stay under their owning `src/features/` directory. Shared controls accept typed values and callbacks rather than clinical workflow decisions.
- Navigation and application chrome belong in `src/app/shell/`.

Existing composable foundations serve multiple workflows: `SectionCard` is shared by chart and profile; `StickyToolbar` and `ToolbarButton` serve input, chart, notes, orders, course, and handoff; `DateRangeFields` serves chart and notes; `EditableTextArea` serves chart, input, orders, course, and handoff; and `StatusDropdown` backs separate order and medication adapters. Prefer these contracts over new feature-local copies. Keep their domain-specific semantics in the owning adapters.

See [architecture](architecture.md#repository-ownership) for module ownership. Promote an abstraction when multiple consumers need the same behavior; keep feature-specific detail local. Do not introduce a second component suite or replace unique clinical workflow semantics with generic flags.

## Interaction and accessibility

Use native form elements for simple controls and Radix primitives for complex dialogs and selectors. Keep controls labelled and operable by keyboard. Verify dialog focus entry/restoration, Escape, selector arrow-key navigation and selection, focus visibility, and overlay dismissal. Radix provides behavior foundations; it does not supply the application’s visual design or guarantee that compositions are accessible.

Preserve accessible names, form labels, dialog roles, close behavior, keyboard interaction, existing feedback, and desktop/mobile layouts when changing shared controls. Keep menus and overlays within the viewport. Check affected paths on desktop and mobile with the offline browser suite.

Keep loading, error, confirmation, and empty states clear and consistent with the owning workflow. AI-generated suggestions and clinical content must remain reviewable and editable through existing flows.

## Browser resource lifecycle

Recording/camera workflows use shared hooks for capture and stream cleanup; file upload/drop workflows use existing conversion and preview ownership patterns. Stop media tracks, revoke object URLs, and clean up listeners/timers when their owner closes, is removed, or unmounts. Keep transcription or error behavior in the owning feature.

## Print and export surfaces

Prescription, home-instruction, and clipboard presentation paths retain feature-specific content. Preserve their meaning and formatting when changing shared UI; screen-only visual checks do not verify print or copied output.
