# Design system and UI conventions

## Visual foundation

The current interface uses Tailwind CSS, shared React UI primitives, Lucide icons, and Motion animations. Global styles in `styles.css` set the Inter font, slate background/text colors, scrollbar styling, and a few animation helpers. `index.html` loads the external font. Follow nearby components for spacing, color, typography, and responsive patterns; no separate theme-token system is implemented.

Keep clinical information readable and status visible. Preserve meaningful medical formatting, numbers, and units in editable text, Markdown, print, and clipboard views. Use the existing clinical Markdown renderer rather than introducing inconsistent rendering paths.

## Component ownership and reuse

- Generic controls belong in `components/ui/`: use existing field labels, text areas, status dropdowns, toolbar controls, file-upload controls, and empty states where suitable.
- Shared dialog/menu composition lives in `ModalShell`, confirmation dialogs, and `PortalMenu`; preserve their semantics and positioning behavior.
- Feature-specific views and components stay under their owning `features/` directory. Shared controls accept typed values/callbacks rather than making clinical workflow decisions.
- Navigation and shared patient/application chrome belong in `app/shell/`.

See [architecture](architecture.md#repository-ownership) for the full ownership guide. Add a shared abstraction only when multiple uses need the same behavior; a single feature's detail can remain local.

## Interaction and accessibility

Preserve accessible names, form labels, dialog roles, close behavior, keyboard interaction, and existing user-facing feedback when refactoring controls. Keep menus and overlays usable within the viewport. Check affected desktop and mobile paths for visible changes; use relevant component and browser tests described in [testing](testing.md).

Keep loading, error, confirmation, and empty states clear and consistent with the owning workflow. AI-generated suggestions and clinical content must remain reviewable/editable through the existing feature flow.

## Browser resource lifecycle

Recording/camera workflows use shared hooks for capture and stream cleanup; file upload/drop workflows use existing conversion and preview ownership patterns. Stop media tracks, revoke object URLs, and clean up listeners/timers when their owner closes, is removed, or unmounts. Keep workflow-specific transcription or error behavior in the owning feature.

## Print and export surfaces

The app has feature-specific prescription, home-instruction, and clipboard presentation paths. Preserve their content and meaningful formatting when changing shared UI; a screen-only visual check does not verify print or copied output.
