# Design system and UI conventions

## Visual foundation

ClinSight uses Tailwind CSS v4, semantic CSS variables in `src/styles/tokens.css`, shared React primitives, Lucide icons, Motion, and Radix Dialog and Select behavior. `src/styles/globals.css` imports the token and Tailwind layers and owns global typography, scrollbars, and motion helpers. `index.html` loads Inter.

The light theme defines canvas, surface, content, border, action, focus, clinical status, radius, and card-shadow tokens. Tailwind exposes them as utilities such as `bg-canvas`, `text-content-primary`, `border-border-default`, `bg-action`, and `rounded-control`. Semantic color ramps preserve the previous Tailwind values under ClinSight names (`neutral`, `action`, `danger`, `critical`, `warning`, `info`, `pending`, `success`, `attention`, and `accent`), so existing clinical/status distinctions remain stable while their values are centrally managed. Application JSX no longer uses the former palette names. Use semantic utilities for all new or changed UI.

Spacing and typography use Tailwind's shared spacing and type scales; do not add one-off values when an existing scale fits. Use the semantic radius and shadow tokens for shared controls and cards. Workflow-specific dimensions remain local where they express layout constraints rather than design language.

Clinical information must remain readable and statuses distinct. Preserve meaningful medical formatting, numbers, and units in editable text, Markdown, print, and clipboard views. `src/components/ui/RichContent.tsx` owns generic safe rendering for plain text, Markdown, and explicit HTML fragments; `src/components/clinical/ClinicalMarkdown.tsx` adds clinical references, citations, and search decoration. Markdown supports GFM, KaTeX math, and a sanitized semantic HTML subset. Footnote syntax is outside the GFM contract and remains literal text. Source disclosure is opt-in so ordinary displays do not repeat their content. HTML is sanitized before rendering, generated element IDs are scoped, links are restricted to safe schemes, and images render as alt text to avoid remote requests. Do not preprocess and persist display content or use raw HTML injection.

## Component ownership and reuse

- Generic controls belong in `src/components/ui/`. Use `Button`, `Badge`, `TextInput`, `TextArea`, `FieldLabel`, status selectors, toolbar controls, file-upload controls, and empty states where their contracts fit.
- Shared dialogs live in `src/components/dialogs/` and compose through `ModalShell`. Dialog focus, Escape handling, and close behavior use Radix Dialog. Status selectors use Radix Select, while order and medication status meanings remain in their feature/domain adapters.
- Clinical Markdown and chat input live in `src/components/clinical/`; keep source references and clinical workflow semantics there. Generic content parsing and rendering belongs in `src/components/ui/RichContent.tsx`.
- Feature-specific views and components stay under their owning `src/features/` directory. Shared controls accept typed values and callbacks rather than clinical workflow decisions.
- Navigation and application chrome belong in `src/app/shell/`.

Existing composable foundations serve multiple workflows: `SectionCard` is shared by chart and profile; `StickyToolbar` and `ToolbarButton` serve input, chart, notes, orders, course, and handoff; `DateRangeFields` serves chart and notes; `EditableTextArea` serves chart, input, orders, course, and handoff; and `StatusDropdown` backs separate order and medication adapters. Prefer these contracts over new feature-local copies. Keep their domain-specific semantics in the owning adapters.

Long patient-note, chart-section, course-detail, and handoff-summary editing use `EditableTextArea` with the `DocumentTextEditor` composition. It offers visual, source, and rendered-preview modes. Visual conversion is enabled when Markdown round-trips to the same schema content; table-only spacing/alignment normalization is accepted only when reparsing yields the identical document tree and non-table source remains unchanged. Untouched values remain the original string; an intentional table edit can serialize canonical table spacing. Unsupported HTML, math, and other schema content stays in source mode. The visual editor uses Tiptap/ProseMirror and its Markdown bridge, which is currently Beta; keep the fidelity gate until richer syntax has explicit round-trip coverage. Its toolbar supports emphasis, links, ordered/unordered/task lists, block quotes, headings, and table operations. On narrow screens the mode switch stays visible and the touch-sized formatting toolbar scrolls horizontally. Rich HTML paste keeps supported text formatting and table structure, strips active content and event/style attributes, rejects unsafe link schemes, and converts images to their alt text without fetching or attaching them. Plain-text paste follows the editor's text path. CodeMirror powers source mode and is loaded when that mode is opened. If a lazy editor fails to load or render, an error boundary retains the current draft in a labelled plain-text editor. New-patient narrative, line-oriented plan fields, general-management fields, smart append, bulk-order syntax, order and medication notes, SOAP references, and home-instruction follow-up use CodeMirror source mode. Print generation replaces its editor chrome with the exact visible text. Chat composers, prescription instructions, one-line home-instruction recommendations, and compact inline exam fields keep their tailored/native controls.

See [architecture](architecture.md#repository-ownership) for module ownership. Promote an abstraction when multiple consumers need the same behavior; keep feature-specific detail local. Do not introduce a second component suite or replace unique clinical workflow semantics with generic flags.

## Application branding

`src/config/brand.ts` owns the readonly `BRAND` display name, login tagline, SVG geometry, and derived browser icon URL. Use `BRAND.name` for string-only labels and attribution; use `BrandName` for inline JSX prose. Do not copy app-name literals, SVG paths, or encoded icon URLs into consumers.

Product identity components live in `src/components/brand/`. `Brand` composes the mark and name with horizontal/stacked layouts and small/medium/large presets; `showName={false}` names the standalone mark accessibly, and `showTagline` adds the login tagline. Its name defaults to a span; callers choose `nameAs="h1"` when it is their page heading. `BrandMark` renders decorative geometry by default, with `meaningful` for an independently labelled image, optional `badge`, and action/white tones. Class overrides serve layout and exceptional contexts such as the loading overlay; shared treatments belong in the presets. Spinner, motion, cancellation, and navigation behavior remain in consumer workflows.

Vite's `transformIndexHtml` uses `src/config/brandHtml.ts` to populate the title, favicon, startup mark, and startup label in development and production before React loads. The startup screen retains minimal inline CSS so it can render while the bundle is pending; its styles are the pre-CSS presentation exception, not a second logo/name definition. Browser icon color is defined in the brand module because icons cannot inherit CSS tokens; it matches the existing action token.

Branding changes do not rename storage keys, export filename prefixes, diagnostic prefixes, package identifiers, test-mode constants, or internal URL bases. Editable clinic identity and contact/account addresses are separate from product identity.

## Interaction and accessibility

Use native form elements for simple controls and Radix primitives for complex dialogs and selectors. Keep controls labelled and operable by keyboard. Verify dialog focus entry/restoration, Escape, selector arrow-key navigation and selection, focus visibility, and overlay dismissal. Radix provides behavior foundations; it does not supply the application’s visual design or guarantee that compositions are accessible.

Preserve accessible names, form labels, dialog roles, close behavior, keyboard interaction, existing feedback, and desktop/mobile layouts when changing shared controls. Keep menus and overlays within the viewport. Check affected paths on desktop and mobile with the offline browser suite.

Keep loading, error, confirmation, and empty states clear and consistent with the owning workflow. AI-generated suggestions and clinical content must remain reviewable and editable through existing flows.

`src/components/ui/LoadingFeedback.tsx` provides a polite `LoadingIndicator`, a centered branded `LoadingScreen`, reduced-motion `Skeleton` shapes and a generic `ErrorState`. Compose these primitives in the feature that owns the pending content; keep available chrome visible and skeletonize only the pending region. Reuse app identity through `Brand`, `BrandMark`, and `BrandName`, use concise status text that describes the actual operation, and keep old valid results visible during refresh. Skeleton shapes are decorative and hidden from assistive technology. Feature imports use a lightweight feature-shaped fallback through `createLazyFeature`; successful lazy modules remain shared when navigating away and back.

Dashboard search/date controls and patient-scoped order/note filters retain their small UI values in memory while navigating during the current session. Keep clinical records, note drafts, and generated results in their existing feature/patient-store owners; do not add them to the generic view-state cache.

Dashboard search/date controls and patient-scoped order/note filters retain their small UI values in memory while navigating during the current session. Keep clinical records, note drafts, and generated results in their existing feature/patient-store owners; do not add them to the generic view-state cache.

## Browser resource lifecycle

Recording/camera workflows use shared hooks for capture and stream cleanup; file upload/drop workflows use existing conversion and preview ownership patterns. Stop media tracks, revoke object URLs, and clean up listeners/timers when their owner closes, is removed, or unmounts. Keep transcription or error behavior in the owning feature.

## Print and export surfaces

Prescription, home-instruction, and clipboard presentation paths retain feature-specific content. Preserve their meaning and formatting when changing shared UI; screen-only visual checks do not verify print or copied output.
