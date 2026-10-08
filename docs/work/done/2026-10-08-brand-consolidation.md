# Consolidate application branding

Status: done
Owner: Codex
Updated: 2026-10-08

## Goal

Define application identity once and reuse it across React, initial HTML, and browser notifications, so changing the app name or logo does not require editing multiple implementations.

## Scope

- Centralize the display name, login tagline, logo geometry, and derived icon data URL.
- Provide small shared React components for the mark, name, and common logo/name composition.
- Migrate application branding in the sidebar, login, loading surfaces, footer, legal copy, chart attribution, and prescription attribution.
- Generate the document title, favicon, and pre-React bootstrap branding from the same source in development and production.
- Document ownership and verify desktop/mobile presentation, accessibility, and HTML boot behavior.

## Non-goals

- A visual redesign, new logo, theme system, backend, or white-label configuration.
- Renaming persistence keys, package identifiers, test-mode constants, export filename prefixes, diagnostic prefixes, or internal URL bases.
- Editing clinical text, existing records, user-entered clinic names, legal claims, contact addresses, or account examples.

## Initial findings

- `src/components/ui/Icons.tsx` exposes `Icons.Logo` through Lucide's stethoscope; the same icon also serves a separate clinical icon role.
- `src/app/shell/Sidebar.tsx` and `src/features/access/LoginPage.tsx` separately compose a badge, name, and layout. Login owns the tagline.
- `src/components/ui/LoadingFeedback.tsx` and `src/components/LoadingOverlay.tsx` use the logo with different loading compositions.
- `index.html` duplicates the SVG geometry, embeds a favicon data URL, and hardcodes the title and startup message. The title says `Clinsight`; startup says `ClinSight`.
- `src/config/appConfig.ts` contains another copy of the favicon data URL, consumed as the notification icon and badge by `src/services/notificationService.ts`.
- Application names are repeated in footer, legal prose, chart attribution, and prescription attribution. Prescription clinic identity is separately editable and must remain distinct from product identity.
- `tests/e2e/smoke.spec.ts` already verifies startup while the React bundle is delayed; it also checks the shell screenshot. `tests/loading-feedback.test.tsx` covers accessible startup status.
- The inspected working tree was clean. Only the root `AGENTS.md` was found.

## Implemented API and ownership

### Framework-independent identity

`src/config/brand.ts` has no React, browser globals, patient types, or AI dependencies. It exports a readonly `BRAND` definition with `name`, `tagline`, and a typed `mark` description containing the SVG view box, stroke defaults, and geometry. Uses `ClinSight` as the canonical display spelling, matching the repository documentation and startup message. Keep the current stethoscope shape and existing semantic colors.

Derive a safely serialized SVG and notification/favicon data URL from this definition through a small pure helper. Store geometry once; React renders its typed elements, and HTML/icon serialization consumes those same elements. Avoid `dangerouslySetInnerHTML`, arbitrary SVG markup, new SVG tooling, and a second hand-maintained asset. Keep context-specific appearance in presentation presets and existing tokens rather than duplicating brand colors in consumers.

### React presentation

Product-specific shared components live under `src/components/brand/`, using direct imports and the repository's default-export convention:

- `BrandMark`: renders the canonical SVG. Supports a small size/tone API, a badge option, and a layout class escape hatch. Decorative by default; an explicitly meaningful standalone mark receives an accessible name from `BRAND.name`.
- `BrandName`: renders `BRAND.name` as inline text. The caller owns heading semantics and surrounding prose.
- `Brand`: composes the mark and name with `layout="horizontal" | "stacked"`, `size="sm" | "md" | "lg"`, and `showName`. `showTagline` supports the existing login use case; `nameAs="h1"` retains its page heading while other names default to spans. Typography, badge treatment, and spacing presets live here.

Example consumers: `<Brand size="sm" showName={!isCollapsed} />` for the sidebar; a stacked large composition inside the login's existing heading/layout; `<BrandMark size="lg" />` for loading. Keep motion, spinner, cancellation, sidebar behavior, and login behavior with their current owners. An icon-only sidebar identity must remain accessible without repeating a visible name to assistive technology.

Services and string-only consumers import `BRAND` or the derived icon URL directly. UI prose may use `BrandName` or `BRAND.name`; it does not need a logo wrapper.

### HTML before React

A focused Vite `transformIndexHtml` integration consumes the pure brand definition/helper. It replaces explicit placeholders for the title, favicon, bootstrap mark, and startup label in `index.html` in both dev serving and production builds. Escape text and attributes appropriately. Startup remains inline and visible while JavaScript is pending; setting `document.title` after mount alone does not meet this requirement.

Retain the minimal bootstrap CSS and reduced-motion spinner. Its necessary pre-CSS styling is a documented presentation exception; the SVG geometry and app name are still generated, never copied. Preserve base-path compatibility and avoid extra startup network requests.

## Implementation sequence completed

1. **Establish the source and components.** Add the pure brand definition and serializer, then the three React components with presets matching existing contexts. Compare the dashboard to its existing baseline and inspect affected desktop/mobile appearance and accessible names.
2. **Migrate React branding.** Replace sidebar/login compositions and loading marks; centralize display names in footer, legal prose, and generated attribution labels. Preserve wording around substitutions, especially clinician-review language. Leave the editable prescription clinic default unchanged because it represents a clinic rather than the product.
3. **Unify browser surfaces.** Wire the Vite HTML transform and notification icon to the same definition. Remove `APP_ICON_DATA_URL` from `appConfig.ts` and remove `Icons.Logo` after migrating all consumers; retain the unrelated clinical stethoscope icon. Do not leave compatibility aliases or duplicated SVG sources.
4. **Document and verify.** Update `docs/design-system.md` to replace its `Icons.Logo` guidance with the new API and bootstrap exception; update `docs/architecture.md` with brand ownership. Verify, then move this same tracker to `docs/work/done/` when implementation acceptance criteria pass.

## Acceptance criteria

- [x] One definition supplies display name, tagline, and logo geometry; changing it updates React, title, favicon, bootstrap, and default notification imagery.
- [x] All intended user-facing product-name references use the canonical spelling; any remaining literals have a documented non-brand purpose.
- [x] Sidebar expanded/collapsed, login, loading, footer, and attribution retain their layout and behavior except the intended spelling consistency.
- [x] Startup branding appears with the app bundle blocked, and no placeholders remain in served or built HTML.
- [x] Marks have appropriate decorative/meaningful semantics; heading hierarchy, status messages, keyboard access, and reduced motion remain intact.
- [x] No storage keys, stable IDs, existing clinical content, clinic identity, contact addresses, or import/export contracts change.
- [x] No duplicate `Icons.Logo`, icon data URL, or hand-maintained bootstrap geometry remains.
- [x] Relevant tests, typecheck, build, lint, documentation checks, and formatting pass; desktop/mobile review is recorded.

## Verification plan

- Focused tests for meaningful versus decorative marks and collapsed branding; preserve loading-status coverage.
- Test the brand serializer/HTML transform contract with synthetic alternate name and geometry to prove all derived surfaces follow the source, including escaping and placeholder removal.
- Mock notifications to verify default icon/badge derivation and preserve callers' option overrides.
- Run `npm run typecheck`, `npm run lint`, `npm run build`, relevant Vitest files, `npm run docs:check`, and `npm run format:check` during implementation.
- Run the affected Playwright journeys on desktop and mobile, including startup with delayed JavaScript and shell appearance. Review intentional casing changes before updating snapshots; inspect login, both sidebar states, loading, and prescription screen/print attribution.

## Progress

- Shared identity, React consumers, notification icons, and HTML transform implemented; old logo/data-URL aliases removed.
- Architecture and design-system guidance updated. Remaining literals are intentional compatibility identifiers, editable clinic identity, and contact/account addresses.
- Completed; no next action or blocker.

## Verification

- `npm test`: 53 files, 154 tests passed. Final focused brand/loading rerun: 6 tests passed.
- `npm run lint`: passed, including `npm run typecheck`.
- `npm run build`: passed. Browser runs also built the isolated test bundle.
- `npm run check:dead-code`: passed after removing an unused exported internal shape type.
- `npm run test:e2e -- tests/e2e/smoke.spec.ts tests/e2e/persistence.spec.ts --update-snapshots`: 28 passed, 2 intentional skips across desktop/mobile. The desktop dashboard baseline changed only for canonical name capitalization; reviewed against the committed original.
- Final browser run without snapshot updates, restricted to startup, shell, collapsed branding/login, and order/prescription checks: 7 passed, 1 intentional mobile skip for the desktop-only sidebar.
- Inspected desktop/mobile login, expanded/collapsed sidebar, pre-React startup, and prescription screenshots, including the attribution. Print capture verifies attribution and retains medication/dose text.
- Vite development HTML fetched from a temporary local server contains the canonical title, generated logo/favicon, and startup message with no brand placeholders; server stopped afterward.
- `npm run docs:check`, `npm run format:check`, and `git diff --check`: passed.
- The initial sandboxed browser attempt could not bind the preview port; the authorized retry completed successfully. No live AI or external network access was used in browser tests.

## Outcome

Application identity is centralized in `src/config/brand.ts`, with reusable React branding and derived startup/browser icons. Display name capitalization is consistently `ClinSight`; existing clinical data, storage keys, import/export identifiers, clinic identity, and contact/account addresses are preserved. Architecture and design-system documentation now explain the API and the minimal pre-CSS bootstrap styling exception.
