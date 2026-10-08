# Implement the Clinsight visual identity

Status: done
Owner: Codex
Updated: 2026-10-08

## Goal

Replace the existing stethoscope product logo with a refined vector reconstruction of the supplied interlocking C/S mark, and use **Clinsight** consistently as the display name across the existing application.

## Scope

- Shared identity, React branding components, startup HTML, favicon, notification icon/badge, existing product-name text, and print attribution.
- Full, icon, and wordmark variants; configurable dimensions and CSS class; explicit light/dark treatments and monochrome output.
- Flat, scalable SVG geometry and implementation/visual verification.
- Update current authoritative branding documentation when implementation lands.

## Non-goals

- Backend, persistence migrations, changes to clinical data or AI behavior, navigation redesign, or a global application dark-mode project.
- New brand effects, raster logo assets, gradient fills, shadows, or a different monogram concept.
- Renaming storage keys, stable IDs, package names, URLs, email addresses, export prefixes, or rewriting historical/user-authored clinical records.

## Repository findings

- `src/config/brand.ts` already centralizes identity, geometry, serialization, and browser icon generation. Extend it rather than adding a parallel branding system.
- `src/components/brand/Brand.tsx`, `BrandMark.tsx`, and `BrandName.tsx` already serve product identity. Existing props include size presets, layout, `showName`, badge, and tone; migrate their callers together.
- `src/config/brandHtml.ts` and the existing Vite transform populate startup, document title, and favicon before React loads. Preserve this path and its escaping tests.
- `src/services/notificationService.ts` consumes the derived icon URL and supports caller overrides.
- The current brand components add teal tiles and shadows; startup has a matching padded tile. These treatments need replacement to present the supplied mark directly.
- The application already uses Inter, including weight 700. The screenshot does not establish an exact font or authoritative color specification. The geometry and colors below are deliberate flat-color approximations, not a claim of a pixel-exact trace.
- Only the root `AGENTS.md` was found. The task began with this planned tracker as the only untracked change.
- Continue the ownership established in [brand consolidation](2026-10-08-brand-consolidation.md). Its former display spelling is superseded by this request. Screenshot CI policy is recorded in the [superseded CI browser tracker](2026-10-08-github-ci-browser-failures.md).

## Visual specification and SVG source

Preserve the upper-left mint C, lower-right teal return curve, central teal dot, and transparent separation around the dot. The two curved bodies interlock visually; do not replace them with ordinary typed letters, a chain icon, or a generic medical symbol. The reference has a stacked lockup; retain that on login, with a horizontal lockup for the sidebar.

Use this exact starting SVG. It reconstructs the reference with matching 60-unit curve radii, 40-unit body strokes, round exposed terminals, and a 40-unit dot. The circular cutout is intentional geometry, not a shadow or visual effect. It remains transparent on any background. Do not replace it with a white painted circle.

```svg
<svg xmlns="http://www.w3.org/2000/svg"
     width="224" height="240" viewBox="0 0 224 240"
     fill="none" role="img" aria-label="Clinsight">
  <defs>
    <mask id="clinsight-c-cutout"
          x="0" y="0" width="224" height="240"
          maskUnits="userSpaceOnUse"
          maskContentUnits="userSpaceOnUse"
          style="mask-type:luminance">
      <rect width="224" height="240" fill="white"/>
      <circle cx="112" cy="148" r="32" fill="black"/>
    </mask>
  </defs>
  <path d="M146 28 H88 A60 60 0 0 0 88 148"
        stroke="#5EDBC5" stroke-width="40"
        stroke-linecap="round" stroke-linejoin="round"
        mask="url(#clinsight-c-cutout)"/>
  <path d="M112 88 H136 A60 60 0 0 1 136 208 H80"
        stroke="#008F87" stroke-width="40"
        stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="112" cy="148" r="20" fill="#008F87"/>
</svg>
```

Execution rules:

1. Store these numbers once in the typed brand definition. Add only the typed shape/paint/cutout fields needed to express this SVG; do not build a general SVG parser. React and the pure serializer must consume the same definition.
2. Preserve `viewBox="0 0 224 240"`, circular arcs, and uniform scaling. Do not use `vector-effect="non-scaling-stroke"`: strokes must scale with the mark. The square favicon viewport must contain the whole mark with centered `xMidYMid meet` alignment, never stretch it.
3. Render in this order: masked C, teal return curve, teal dot. Keep mask white/black values unchanged in all color modes. Only visible paints change.
4. React must give every mask a unique ID using `useId()` and reference that same ID. The serializer accepts an escaped ID prefix; standalone files/data URLs may use the fixed ID above because each is a separate document. Do not use raw HTML injection.
5. The gap between the 20-unit dot and 32-unit cutout is 12 units, approximately 0.8 px in a 16 px square viewport. At implementation time inspect actual 16/20/24/32 px renders before freezing geometry. If the gap closes perceptually, increase the cutout radius to 34 across the canonical geometry, then repeat every size/color check. Do not create ad hoc per-consumer path variants.
6. Optical refinement is permitted only to improve the supplied concept: equalize related radii/strokes, improve tangency or spacing, and retain rounded exposed terminals. Record any changed canonical coordinates and rationale here before closing the task. The intentional concave cutout need not have a round linecap.
7. No filters, blur, gradients, embedded images, or externally referenced SVG resources. For print workflows needing outline-only artwork, generate expanded strokes and a boolean-subtracted cutout from this same source, visually compare it, and retain vector output; do not manually maintain another geometry source.

### Color and theme contract

- Light, full color: C `#5EDBC5`, return curve/dot `#008F87`, wordmark `#0B2030`.
- Dark, full color: C `#5EDBC5`, return curve/dot `#26B8AA`, wordmark `#F4FAF9`.
- Single color: both visible paths, dot, and wordmark use `currentColor`; mask paints remain white and black.
- Black on white: monochrome with `color: #000`. Reversed white on black: monochrome with `color: #fff`. Neither has an opaque background rectangle.
- Default to `theme="light"` because the current app is light. `theme="dark"` describes the host background; it does not set the surrounding page background or introduce a global theme switch.
- Put component-scoped brand variables in the existing styles and keep the pure palette in the brand definition available to standalone serialization. Derive variable values from the palette rather than independently maintaining conflicting hex values. Do not replace clinical status/action tokens with logo colors.
- Use monochrome in forced-colors and print contexts where appropriate. Print attribution remains readable black text even when background printing is disabled. A black favicon is acceptable for a constrained monochrome target; prefer the full-color SVG for the ordinary browser favicon.

### Wordmark and lockup

The exact text is `Clinsight`: capital C and every remaining letter lowercase. Use the existing Inter font, weight 700, letter spacing `-0.04em`, line height `1.05`, and no text transform. Keep the spelling and glyph case visible even in uppercase-styled surrounding UI. Do not recolor the i dots independently or add decorative effects.

Use HTML text in the app so it remains accessible and uses the existing font. `BrandName` in ordinary prose must continue inheriting surrounding typography; bold lockup typography belongs in `Brand`, not every inline product mention.

For a standalone SVG wordmark, this is the explicit equivalent at a 64-unit font size:

```svg
<svg xmlns="http://www.w3.org/2000/svg"
     width="320" height="84" viewBox="0 0 320 84"
     role="img" aria-label="Clinsight">
  <text x="8" y="64" fill="#0B2030"
        font-family="Inter, Arial, sans-serif" font-size="64"
        font-weight="700" letter-spacing="-2.56">Clinsight</text>
</svg>
```

This text-based export is font-dependent. For portable final print assets, use the actual Inter 700 font to convert text to vector outlines and verify the result before delivery. Do not claim a fallback-font rendering matches the approved typography. An outlined wordmark is vector, not raster. Do not add another runtime font download.

For an executable full horizontal SVG lockup, use a `viewBox="0 0 576 240"` root, put the icon's definitions and visible elements inside it unchanged, and add a nested SVG at `x="248" y="78" width="320" height="84" viewBox="0 0 320 84"` containing the wordmark text above. Keep just the outer accessible label. This fixes icon-to-wordmark spacing at 24 units; it is a reference export composition, not a requirement to constrain the app's responsive wrapper to this aspect ratio.

## Component API

Extend the existing default-exported `Brand` with this contract:

```tsx
type BrandProps = {
  variant?: "full" | "icon" | "wordmark"; // default: full
  size?: "sm" | "md" | "lg" | number; // default: md
  theme?: "light" | "dark"; // default: light
  colorMode?: "full" | "mono"; // default: full
  layout?: "horizontal" | "stacked"; // default: horizontal
  className?: string;
  nameAs?: "span" | "h1";
  showTagline?: boolean;
};
```

- A numeric `size` is a positive CSS-pixel icon viewport height for `icon` and `full`, with proportional width. For `wordmark`, it is the font size in CSS pixels. Reject/fall back from nonpositive or nonfinite numbers. Document this distinction.
- Presets: `sm` = 32 px icon/20 px wordmark; `md` = 40/26; `lg` = 80/40. Numeric `full` uses wordmark font size `size * 0.65` horizontally or `size * 0.5` stacked. Icon-to-text gap is `size * 0.25` in either direction. Keep the tagline's existing text and 12 px typography.
- Apply `className` to the outer rendered element for placement and custom `color` in mono mode. Avoid conflicting Tailwind size classes; the size prop owns intrinsic dimensions. Use shrink protection on the icon and no wrapping within the wordmark. Let callers select an appropriate preset for narrow surfaces.
- `full` renders both parts; its SVG is decorative because visible text names the brand. `icon` renders only the SVG, labelled `Clinsight` with `role="img"`. `wordmark` renders only the text and no SVG. Ignore `showTagline` for icon/wordmark variants.
- Preserve `nameAs="h1"` on the login full lockup. Keep `BrandMark` decorative by default, with its existing explicit meaningful option for independent images. No redundant image and text announcements.
- Migrate `showName={false}` to `variant="icon"`, remove obsolete badge/tone props after migrating all callers, and replace `tone="white"` with mono mode plus white text color. Keep `BrandName` as the lightweight inline text helper.

Examples after migration:

```tsx
<Brand variant={isCollapsed ? "icon" : "full"} size="sm" />
<Brand layout="stacked" size="lg" nameAs="h1" showTagline />
<Brand variant="wordmark" size={24} theme="dark" />
<Brand variant="icon" size={16} colorMode="mono" className="text-black" />
```

## Implementation sequence

1. **Claim and recheck.** Mark this tracker active, inspect the current working tree and relevant source/docs, and preserve unrelated changes. Recheck the existing CI/browser task before touching shared snapshots.
2. **Implement the canonical definition.** Set `BRAND.name` to `Clinsight`, replace the stethoscope geometry with the SVG above, add the shared palette and typed cutout/paint roles, and update serialization. Ensure React, startup, favicon, and notifications all derive from it. Keep the unrelated clinical stethoscope icon.
3. **Implement variants and themes.** Update `Brand`, `BrandMark`, and associated styles with the API above. Remove logo tile backgrounds, logo shadows, and unnecessary logo animation. Keep loading spinners, status messages, cancellation, and reduced-motion behavior with their existing owners.
4. **Migrate all existing surfaces.** Sidebar expanded/collapsed; stacked login; `LoadingFeedback`; white mark in `LoadingOverlay`; footer in `App`; legal dialogs; SOAP attribution; prescription attribution. Change bootstrap CSS in `index.html` to display the unobstructed mark without the existing teal tile/padding. Preserve Vite placeholders and pre-React startup behavior. Keep prescription clinic identity separately editable.
5. **Finish browser/export treatments.** Generate full-color favicon/notification icon and a monochrome notification badge from the same geometry; preserve `NotificationOptions` overrides. Standalone icon data URLs must include concrete colors, not depend on document CSS. Check OS notification rendering where available and disclose unverified platforms. Produce vector icon, wordmark, and full-lockup exports from the same source if delivering print assets; verify outlined-font exports before calling them portable.
6. **Audit spelling.** Search application code, HTML, tests, current documentation, and accessible labels for case variants. All human-readable product references must say `Clinsight`, including loading labels and legal/print attribution. Update current README, DESIGN, AGENTS, and authoritative docs as applicable. Preserve machine identifiers and user-authored content. In historical trackers, normalize prose references while explicitly marking former exact casing in historical test/code quotations as historical evidence, not current guidance; do not falsify recorded results.
7. **Verify and document.** Update `docs/design-system.md` with the final API, geometry/palette ownership, theme behavior, size semantics, monochrome/print guidance, and bootstrap exception. Update `docs/architecture.md` only if ownership details change. Complete the checks below, record real results, and move this same tracker to `done/` only after implementation acceptance passes.

## Acceptance criteria

- [x] The visible product name and accessible brand labels use exactly `Clinsight`.
- [x] C/S geometry, central dot, transparent cutout, and consistent body widths are shared by React and generated SVG output; full and mono paints are supported.
- [x] Full, icon, and wordmark variants support size presets/numeric sizing, class, light/dark, and color modes.
- [x] Each React mark gets a unique SVG mask ID. Markup contains no gradients, shadows, image references, or opaque cutout.
- [x] Icon-only renders are visually recognizable at 16, 20, 24, 32, 48, and 128 px on light/dark and black/white mono backgrounds; desktop DPR 1/2 and mobile DPR 3 specimen screenshots were reviewed.
- [x] Login, sidebar, startup, loading, notifications, footer, legal copy, and attribution use the shared identity; generated browser surfaces derive from the shared definition.
- [x] Delayed-bundle startup, desktop/mobile login, collapsed sidebar, print attribution markup, and visual size/theme specimens were inspected.
- [x] Icon-only and decorative accessibility semantics, heading semantics, and reduced-motion behavior are retained in implementation.
- [x] Clinical content, persistence, stable IDs, import/export contracts, clinic identity, and machine identifiers are unchanged.
- [x] Typecheck, lint, production build, documentation, formatting, and whitespace checks pass.
- [x] Focused unit/browser tests pass on this macOS checkout.
- [x] Linux dashboard screenshot refresh was explicitly deferred; existing Linux baselines remain stale until a Linux runner is available.

## Verification plan for implementation

- Extend `tests/brand.test.tsx` for each variant, numeric size/presets, light/dark/mono paints, accessibility, unique mask references, and custom class propagation. Retain alternate-definition serialization/escaping coverage; adapt its geometry fixture to the new typed shape model. Test monochrome badge derivation and caller overrides.
- Update expected spelling in `tests/loading-feedback.test.tsx`, `tests/e2e/smoke.spec.ts`, and `tests/e2e/persistence.spec.ts`. Assert the exact canonical name independently at least once so a shared wrong constant cannot make every test pass.
- Run the focused identity/loading tests, full unit suite, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run docs:check`, `npm run format:check`, and `git diff --check`.
- Run `npm run test:e2e -- tests/e2e/smoke.spec.ts tests/e2e/persistence.spec.ts` for relevant desktop/mobile startup, shell, login, and prescription coverage. Review intended snapshot differences before updating; generate Linux baselines on Linux and macOS baselines on macOS, as documented in `docs/testing.md`.
- During visual verification, render a temporary specimen with the listed sizes, all three variants, both themes, mono black/white, and several simultaneous instances. Inspect at actual pixel size, not only zoomed screenshots. Record refinements rather than claiming geometry is verified from code alone.
- Inspect dev and built HTML for unresolved placeholders, correct title, working standalone favicon, and visible startup mark with JavaScript delayed. Inspect transparent SVG on a non-white background and an actual print/PDF render. No live AI calls are needed.

## Progress

- Replaced the shared stethoscope brand mark with the interlocking C/S geometry, flat palette, light/dark and monochrome rendering, full/icon/wordmark variants, size presets/numeric sizing, and unique per-instance mask IDs.
- Migrated startup HTML, favicon, notifications, sidebar, login, loading surfaces, and existing generated brand-name surfaces through the shared identity. Updated canonical spelling in current product docs and existing assertions. Preserved clinic display identity, internal identifiers, and historical completed trackers.
- Implementation and available local verification are complete. Linux screenshot refresh and CI comparison are deferred by user decision.

## Verification

- `npm test -- tests/brand.test.tsx tests/loading-feedback.test.tsx`: 7 tests passed.
- `npm test`: 53 files, 156 tests passed.
- `npm run lint` (includes `npm run typecheck`): passed.
- `npm run build`: passed.
- `npm run docs:check`, `npm run format:check`, and `git diff --check`: passed.
- `npm run test:e2e -- tests/e2e/smoke.spec.ts tests/e2e/persistence.spec.ts`: after reviewing and updating the changed macOS desktop dashboard baseline, 28 passed and 2 intentional skips across Chromium desktop and mobile. Startup with the bundle delayed, desktop/mobile login, collapsed-sidebar icon, prescription attribution, and persistence workflows passed.
- `npm run test:e2e -- tests/e2e/brand.spec.ts`: 2 passed with DPR 2 in both projects; earlier captures also covered the desktop DPR 1 and mobile DPR 3 defaults. Reviewed 16/20/24/32/48/128 px full-color light/dark and mono black/white specimens.
- `npm run test:e2e -- tests/e2e/persistence.spec.ts --project=chromium --grep 'selects order and medication statuses'`: passed, including generated print markup with dark brand color and preserved medication/dose text.
- Inspected desktop dashboard, collapsed sidebar, desktop/mobile login, delayed-bundle startup, prescription preview, print attribution, and rendered size/color specimens. Geometry is clear at 16 px; no coordinate refinement was needed.
- The first browser run exposed the expected changed desktop macOS dashboard snapshot. The screenshot was visually reviewed and updated; the rerun passed. The Linux dashboard baselines contain the prior lockup and are not used by the current CI path. Per [testing guidance](../../testing.md#screenshot-baselines) and the [superseded CI browser tracker](2026-10-08-github-ci-browser-failures.md), CI keeps functional assertions while macOS performs the pixel comparison locally.
- The standalone logo is vector SVG and no full portable wordmark print file was delivered. Print attribution uses the brand navy inline, and the generated print HTML was verified. No physical printer or PDF output was available for a device-specific check.

## Outcome

Implemented the Clinsight identity across app surfaces and verified local unit checks, browser journeys, and available macOS desktop/mobile captures. Linux dashboard screenshot refresh and the corresponding CI comparison are deferred by user decision; the separate Linux CI tracker remains active for that work.
