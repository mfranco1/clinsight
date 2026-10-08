# Testing and verification

Choose checks based on the changed contract. The complete CI sequence is in `.github/workflows/ci.yml`.

For documentation changes, run `npm run docs:check` and `npm run format:check`. Application code or build configuration changes must at least type-check and build; `npm run lint` includes typecheck.

| Change                                               | Useful checks                                                                                                |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Domain rule, migration, parsing, or pure utility     | Focused Vitest file, then `npm test` when shared contracts are affected                                      |
| React view, hook, or interaction                     | Focused component/hook tests; relevant Playwright workflow for user-visible behavior                         |
| Persistence, attachment, or import/export            | Persistence/attachment unit tests and relevant browser reload/import/export path                             |
| AI task or transport                                 | AI contract, parsing, and transport tests; do not claim a successful local test proves provider availability |
| Type, style, configuration, or documentation checker | `npm run lint`, focused tests/check, and `npm run format:check` as applicable                                |
| Broad change or release candidate                    | `npm run lint`, `npm run format:check`, `npm test`, `npm run build`, `npm run test:e2e`                      |

Tests live under `tests/`; Playwright journeys are in `tests/e2e/`. Fixtures in `tests/fixtures/` and `tests/patient-cases.ts` are synthetic/de-identified. Keep those constraints for new examples.

CI checks type/lint, Prettier, unit tests, production build, then installs Chromium and runs desktop and mobile browser projects. `npm run lint` already includes typecheck. E2E execution itself performs a fresh production build through Playwright's web server.

Record only commands actually run and their result. A build does not verify live Gemini access, deployment, production credentials, backup recovery, or clinical correctness. For visual changes, inspect the affected desktop and mobile paths; use snapshots only where they materially guard a stable layout.
