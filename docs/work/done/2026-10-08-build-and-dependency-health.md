# Build warnings and dependency health

Status: done
Owner: Codex
Updated: 2026-10-08

## Goal

Reproduce and resolve actionable build warnings and dependency problems with a reproducible, compatible toolchain and preserved clinical workflows.

## Scope

- Production/test builds, installation warnings, dependency advisories, peer and engine compatibility, deprecated/unused packages, lockfile integrity, and CI parity.
- Evidence-led fixes and narrowly scoped regression prevention.
- Coordinate security-sensitive dependency findings with the separate [repository safety plan](../ongoing/2026-10-08-repository-safety-and-ai-studio-exit.md).

## Non-goals

- Blanket upgrades, warning suppression, raising bundle limits, or architectural rewrites without a measured problem.
- Backend implementation, live AI requests, or changes to clinical meaning and persistence contracts.

## Acceptance criteria

- [x] Clean installation and all relevant checks pass on the documented Node/npm baseline.
- [x] Every reproduced warning has a recorded cause and resolution; the remaining upstream deprecation has a specific rationale and follow-up.
- [x] Dependency findings distinguish runtime exposure from development/CI exposure; no unresolved exploitable high/critical finding remains at closure.
- [x] Manifest and lockfile agree, dependency relationships are valid, and unused dependencies are removed only after verifying actual use.
- [x] Production chunks remain below 500,000 bytes without suppressing warnings; startup and first-use behavior remain compatible.
- [x] Documentation and CI match the resulting toolchain and verification requirements.

## Progress

All stages are complete. Node 26.11.1 is pinned in `.nvmrc` and used by CI. The clean install, security audit, desktop/mobile workflows, builds, and required checks passed.

Observed on 2026-10-08:

- Working tree was clean before these plans were created.
- The initial local runtime was Node v26.7.0/npm 11.19.0. At the user's direction, the project baseline is now Node v26.11.1/npm 11.20.0; Node 26 is the Current release line and Node 24 remains LTS.
- `npm run build` passed under the local runtime with no warnings. Largest emitted JavaScript chunk: `tiptap-vendor`, 448.45 kB; Vite is 6.4.1.
- `npm ls --depth=0` passed. This does not establish transitive compatibility, absence of vulnerabilities, or clean-install reproducibility.
- Existing [bundle reduction work](../done/2026-10-08-bundle-size-reduction.md) already introduced lazy boundaries and a CI size gate. Reuse its results without treating earlier sizes as current measurements.
- CI uses `npm ci`, lint/typecheck, formatting, documentation, unit tests, a production build/size gate, and desktop/mobile Playwright. Dependabot is configured.
- The initial npm registry audit reported 16 findings (1 critical, 8 high, 2 moderate, 5 low). A non-forced `npm audit fix` updated compatible transitive packages; npm then reported four low findings in nested KaTeX 0.16.47 copies required by the existing math pipeline.
- Upgraded the direct KaTeX dependency to 0.19.0 and added an npm override so `rehype-katex` and `remark-math` resolve the patched release too. The KaTeX advisory lists 0.18.2 as patched; after the lockfile override, npm reported zero vulnerabilities. Focused clinical Markdown tests passed.
- Removed the only Knip finding, an unused `renderBulletedContent` export. Added `dist` to TypeScript's excludes after a concurrent build/typecheck reproduced missing generated-file errors; lint passes with that correction.
- npm 11 initially reported unreviewed dependency install scripts. The pinned `allowScripts` policy below resolves this deliberately: only required esbuild/fsevents scripts run, while the Gemini no-op and protobufjs version-check scripts stay blocked.
- Playwright emits Node warnings because this task environment sets both `NO_COLOR` and `FORCE_COLOR`. All 27 active desktop/mobile cases passed; one existing case was skipped. This warning is in the runner environment, not Vite's production/test build output.
- A Node 26.11.1 clean install now uses a pinned npm `allowScripts` policy: esbuild 0.25.12 and fsevents 2.3.3 are approved; Gemini SDK 1.52.0's no-op and protobufjs 7.6.6's version-check scripts are explicitly denied. `npm ci` completed without script-policy warnings.
- Updated all dependencies with newer releases inside their existing manifest ranges. This refreshed Gemini SDK to 1.52.0 and patch/minor updates across React testing, ESLint, Playwright, Motion, React, and supporting packages. Major upgrades outside declared ranges were not applied.
- React 19.3.0 caused two editor setup tests to fail. Constraining `react` and `react-dom` to `~19.2.4` resolves to 19.2.8 and restores the full 143-test pass.
- One install deprecation warning remains: `node-domexception@1.0.0` is pulled by `fetch-blob@3.2.0` → `node-fetch@3.3.2` in the latest semver-compatible Gemini SDK auth tree. npm outdated offered no fix inside the current SDK range. Replacing that compatibility fallback requires a separately reviewed upstream/major dependency change; track it for the next SDK major review rather than overriding a transitive package unsafely.

## Stage 0 — Reproduce and classify

1. Record the exact revision, Node/npm versions, OS, lockfile version, and CI configuration. Use an isolated checkout so installation does not disturb ongoing work. Do not copy local credentials into it.
2. Run `npm ci`, `npm ls --all`, `npm run build`, `npm run check:bundle-size`, and `npm run build:test` on Node 26.11.1. Capture sanitized warning summaries from installation and both build modes separately. Reproduce any user-observed warning using its actual triggering command if the baseline is quiet.
3. Run `npm audit` for the whole tree and production-only scope, `npm outdated`, and `npm run check:dead-code`. Record tool failures separately from findings; registry unavailability is not a clean audit. Treat outdated packages as candidates, not defects by themselves.
4. Classify findings by source, affected dependency path, severity, environment, reproducibility, and proposed smallest fix. Verify current advisories and migration requirements against primary maintainer documentation before choosing upgrades.
5. Record baseline checks and measured bundle sizes. Keep credentials, application source maps, and clinical data out of reports.

Exit gate: a bounded issue list with evidence and a proposed fix per actionable item. If warnings do not reproduce, record that result and investigate dependency health without inventing a warning fix.

## Stage 1 — Stabilize installation and compatibility

1. Resolve Node/npm/engine ambiguity using the project's pinned Node 26.11.1 baseline. Add version guidance or constraints only where needed to make installation reproducible.
2. Inspect peer conflicts, duplicate incompatible versions, missing or extraneous dependencies, deprecated packages, and lockfile registry/integrity anomalies. Use dependency-path explanations before changing versions.
3. Apply targeted compatible patches first. Keep related editor, React/type, and build/test packages compatible as a group where their contracts require it. Remove unused packages only after checking dynamic imports, configuration, tests, and build tooling.
4. Avoid blind `npm audit fix --force`, lockfile deletion, or permanent overrides that hide incompatible peer requirements. Document any necessary override with its upstream issue and removal condition.

Verification: clean `npm ci`, `npm ls --all`, focused affected tests, typecheck, and both build modes. Stop and resolve new regressions before continuing.

## Stage 2 — Resolve build and vulnerability findings

1. Fix reproduced warnings at their source. For size warnings, attribute actual chunks and imports, preserve the existing lazy-loading boundaries, and measure startup/first-use costs rather than simply rearranging filenames.
2. For vulnerabilities, trace whether the affected code is reachable in the browser, development server, tests, installation scripts, or CI. Address development-tool exposure as well as shipped dependencies.
3. Make upgrades in reviewable groups; consult primary release notes for breaking changes. If no safe patch exists, evaluate removal/replacement or a concrete mitigation and track any unresolved blocker explicitly.
4. Preserve editor serialization, clinical rendering and sanitization, AI task/transport contracts, resource cleanup, and persistence compatibility. Add focused tests only for behavior or regressions affected by the fix.

Exit gate: reproduced warnings are fixed or explicitly accounted for, security blockers are resolved, and fixes have evidence beyond a successful compilation.

## Stage 3 — Regression checks and prevention

1. Run `npm run lint` (includes typecheck), `npm test`, `npm run build`, `npm run check:bundle-size`, `npm run build:test`, `npm run test:e2e`, and `npm run check:dead-code`. Re-run the dependency audit and clean install on the final lockfile.
2. Verify desktop/mobile clinical workflows affected by dependency changes, including editor source preservation, lazy-load recovery, and mocked AI flows. Use synthetic data and no provider network calls.
3. Add only missing, actionable CI dependency checks. Define the failure policy explicitly; avoid duplicate builds or checks that indiscriminately block on every outdated package.
4. Update development/testing guidance and relevant architecture or AI documentation only where facts change. Record actual command results, before/after measurements, and residual limitations.
5. Move this same tracker to `done/` only after acceptance criteria pass. If a release blocker cannot be fixed, retain an accurate blocked status and next action.

## Decisions

- Execute stages sequentially and preserve unrelated work; revert only the relevant change when a stage fails.
- Security containment takes priority if the companion plan discovers exposed credentials. Final dependency changes must be included in its publication scan.

## Verification

Verified on Node 26.11.1/npm 11.20.0 after `npm ci`: npm dependency audit reports zero vulnerabilities; `npm ls --depth=0`, `npm run lint`, `npm test` (50 files/143 tests), `npm run build`, `npm run check:bundle-size`, `npm run build:test`, `npm run test:e2e` (27 passed/1 skipped on desktop/mobile), `npm run check:dead-code`, `npm run docs:check`, `npm run format:check`, and `git diff --check` pass. The largest production chunk is 448.45 kB and neither build emits a Vite chunk warning. The official Node archive checksum was verified before use. `npm ci` emits the single documented upstream `node-domexception` deprecation. Playwright emits only the environment's `NO_COLOR`/`FORCE_COLOR` warning; its tests pass.

## Outcome

Resolved dependency advisories, updated compatible dependencies, secured KaTeX's transitive resolution, removed one unused export, fixed the TypeScript build-output race, and standardized local and CI on Node 26.11.1. All acceptance checks pass. The only remaining notices are the documented upstream `node-domexception` deprecation and harmless Playwright color-environment warning.
