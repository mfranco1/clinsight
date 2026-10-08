# Fix GitHub CI dashboard screenshot failures

Status: active
Owner: Codex
Updated: 2026-10-08

## Goal

Make the GitHub CI workflow pass with reviewed desktop/mobile screenshot baselines that match its Linux environment, while preserving browser workflow coverage.

## Scope

- Diagnose the failed push run, fix dashboard screenshot baseline coverage, and retain useful CI failure diagnostics.
- Document platform-specific baseline generation and review in `docs/testing.md` during implementation.

## Non-goals

- Application behavior, clinical content, persistence, live AI, dependency upgrades, or backend changes.
- Dependabot PR failures, which involve different dependency trees and require separate investigation.
- Disabling screenshot assertions, widening image tolerances without evidence, or updating baselines during ordinary CI verification.

## Acceptance criteria

- [ ] The detailed failure is confirmed from an authenticated job log or a matching Linux reproduction.
- [ ] Reviewed Linux desktop/mobile baselines exist for the current implementation; existing macOS coverage remains usable.
- [ ] Both dashboard cases pass on Linux without snapshot updates, followed by the complete desktop/mobile suite.
- [x] CI retains failure diagnostics and documentation explains how to review intentional snapshot changes.
- [ ] Local required checks pass and a GitHub CI run on the resulting revision passes both jobs.

## Evidence

- Latest push run inspected: [CI #6](https://github.com/mfranco1/clinsight/actions/runs/37764846348), revision `188b0fedd7fc571f703870c3348a9f6b776c7a1b`. Local HEAD is `82a4a41`, with subsequent branding changes; it is not the failed revision.
- GitHub job/annotation APIs confirm that only the browser-test step failed. Install, typecheck/lint, formatting, documentation, unit tests, production build, bundle-size check, and Chromium installation passed. The separate Gitleaks job passed.
- Browser summary: 29 passed, 1 skipped, 2 failed. Both failures are `loads the dashboard shell` in `tests/e2e/smoke.spec.ts`, one each for `chromium` and `mobile`.
- Both the failed revision and current HEAD contain only `dashboard-shell-chromium-darwin.png` and `dashboard-shell-mobile-darwin.png`. No Linux baselines are tracked. CI runs on `ubuntu-latest`; no custom snapshot path is configured.
- Installed Playwright source sets `testInfo.snapshotSuffix = process.platform` and includes that suffix in the default screenshot path. Linux therefore requires `dashboard-shell-chromium-linux.png` and `dashboard-shell-mobile-linux.png`. Missing expected screenshots fail ordinary verification.
- This establishes a deterministic baseline coverage defect and is the high-confidence explanation for the observed failures. The exact original error text is unverified: unauthenticated log download returned HTTP 403, the job page requires sign-in to view logs, and the run has zero retained artifacts.
- Current HEAD passes both dashboard cases on macOS without snapshot updates. This supports a platform baseline problem but does not verify the failed revision or Linux rendering.

## Fix plan

### 1. Confirm on Linux and retain diagnostics

1. Read the authenticated [failed job log](https://github.com/mfranco1/clinsight/actions/runs/37764846348/job/113269853072), or reproduce the two dashboard cases at `188b0fe` in an isolated Linux checkout with Node 26.11.1, `npm ci`, and the lockfile-matched Playwright Chromium installation. Keep environment credentials absent.
2. Confirm missing Linux screenshot paths; investigate any additional assertion failures before generating baselines. Do not treat a macOS run with `CI=true` as a Linux reproduction.
3. [x] Add a failure artifact upload to `.github/workflows/ci.yml` for `test-results/`, covering screenshots, comparison output, and existing retry traces. Use short retention and synthetic offline fixtures only. Consider an HTML reporter alongside the GitHub reporter if it materially helps review; do not upload environment files or provider data.

### 2. Add reviewed Linux baselines

1. Generate the two dashboard baselines on Linux at the implementation revision, using the same Node, lockfile, Chromium, and offline fixtures as verification. Run only the dashboard cases with `--update-snapshots` for this deliberate generation step.
2. Review both generated images for correct layout, empty-patient state, branding, and synthetic/demo-only content. Current HEAD includes a branding update after the failed push, so generate from current code rather than copying images from that old run.
3. Commit the two `-linux.png` files alongside the existing `-darwin.png` files. Keep platform-specific filenames; renaming macOS images to Linux names does not establish rendering parity.
4. [x] Update `docs/testing.md` with platform-specific baseline requirements, Linux generation instructions, image-review expectations, and artifact access. If runner/font drift becomes a demonstrated problem, standardize the rendering environment then; do not add unrelated runner changes preemptively.

### 3. Validate and close

1. On Linux, run the two dashboard cases without updates, then the full `npm run test:e2e` suite. Verify that the run does not create or change tracked baselines.
2. Run `npm run lint`, `npm run format:check`, `npm run docs:check`, `npm test`, `npm run build`, and `npm run check:bundle-size`. Lint includes the required typecheck. Recheck macOS dashboard cases if their test/configuration or baselines change.
3. Inspect an actual GitHub run at the resulting revision. Require both application verification and secret scanning to pass; record its URL and actual results.
4. Move this tracker to `done/` only after acceptance criteria pass. Until then, preserve the distinction between confirmed missing baseline coverage and unavailable original log details.

## Progress

Added a seven-day artifact upload of Playwright's `test-results/` on CI failure and documented platform-specific screenshot baseline generation/review in `docs/testing.md`. Linux baselines and a Linux run remain outstanding. This machine is macOS, and Docker is installed without a running daemon, so Linux screenshots cannot be generated or honestly reviewed here. Next action: generate both Linux baselines on a Linux runner and validate the focused and full browser suites before closing the tracker.

## Verification

- `git status --short`: clean before investigation.
- Read GitHub runs, jobs, check annotations, and artifact metadata; inspected workflow, Playwright configuration, source, and baseline files at failed and current revisions.
- Node 26.11.1: `npm run test:e2e -- tests/e2e/smoke.spec.ts --grep 'loads the dashboard shell' --reporter=line`: 2 passed on macOS, no snapshot updates. Initial sandbox run could not bind port 4173; rerun with server permission passed. Only environment color warnings remained.
- Linux reproduction, baseline generation, and full-suite checks have not been run. The installed Docker client cannot connect to a daemon.
- `npm run docs:check`, `npm run format:check`, and `git diff --check`: passed after the workflow, documentation, and tracker edits.

## Outcome

The CI diagnostics and baseline guidance are implemented. The browser-test failure remains unresolved until reviewed Linux baselines and a passing GitHub run are verified.
