# Startup loading bar and legal modal loading

Status: done
Owner: Codex
Updated: 2026-10-12

## Goal

Replace the actual startup spinner and remove the temporary loading panel when opening legal modals.

## Scope

- Replace the pre-React HTML bootstrap spinner with an indeterminate bar.
- Import privacy and terms modals eagerly.
- Document the separate HTML startup loading boundary.

## Acceptance criteria

- [x] Startup HTML renders a loading bar with static reduced-motion feedback.
- [x] Legal modals open directly without a full-page fallback.
- [x] Relevant checks pass.

## Progress

Implementation and verification complete.

## Verification

- Typecheck and production build passed.
- Brand, loading-feedback, and lazy-feature tests passed (9 tests).
- Opened and closed privacy and terms in the local browser; modal content rendered directly.
- Documentation and formatting checks passed.
- Added a regression assertion covering the pre-React loading bar; brand tests passed again.

## Outcome

The missed spinner was in `index.html`, before React loads. Full-page loading fallbacks for legal modals were rendered alongside the flex app shell; eager imports remove those fallbacks. Durable guidance added to `docs/design-system.md`.
