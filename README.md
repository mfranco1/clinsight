# ClinSight

ClinSight is a React and TypeScript clinical documentation application built with Vite. The interface supports patient intake, charts, orders, notes, handoffs, and clinical assistance.

## Requirements

- Node.js 24 LTS (the CI baseline)
- npm

## Local development

```sh
npm ci
npm run dev
```

Vite serves the app locally. To enable AI-assisted features, create `.env.local` with `GEMINI_API_KEY=your-development-key`; restart the dev server after changing environment values. The current development integration calls Gemini from the browser bundle. Do not use a private or production credential with this setup. A server-side AI proxy/backend is intentionally deferred and must be implemented before production use of private credentials.

## Architecture

- `App.tsx` coordinates top-level navigation and patient workflows; `app/shell/` owns the shared application and patient navigation chrome.
- `features/` owns feature screens and feature-specific components, selectors, hooks, and workflows (`chart`, `chat`, `input`, `notes`, and `orders`).
- `domain/` contains framework-independent patient and order rules; `types.ts` defines shared contracts.
- `components/ui/` and `hooks/` contain reusable presentation primitives and browser lifecycle hooks.
- `services/` owns persistence, attachments, diagnostics, and AI integration. `services/ai/clinicalAiGateway.ts` defines the application-facing AI contract; task modules and the Gemini transport implement the current client adapter.
- `utils/` contains focused utilities. The root `utils.ts` remains a compatibility re-export surface while callers are migrated.

Keep business rules close to their owning domain or feature. Keep shared primitives generic and behavior-focused. Preserve existing UI and workflow behavior when changing internal structure.

## Quality checks

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
npm run format:check
```

Vitest and Testing Library cover pure domain logic, hooks, and component behavior. Playwright runs desktop Chromium and a mobile viewport against the production preview. The `CI` GitHub Actions workflow runs typecheck/lint, unit tests, production build, and browser tests. `format:check` is available locally; it is not yet a CI gate while the existing repository formatting baseline is being normalized.

## Persistence compatibility

Patient records are persisted in browser storage. Keep migrations backward-compatible, and cover legacy hydration and attachment round trips when changing persisted shapes. Files are represented with serializable metadata and data for storage/export, then hydrated for runtime use; object URLs are runtime-only and must be released when no longer needed.

## AI integration boundary

Features call typed actions through the gateway rather than depending on Gemini SDK details. Keep provider-specific request/response handling in the AI adapter and task modules. The gateway is an interface seam, not a server proxy: moving credentials and provider calls to a proper backend remains future work and is out of scope for this refactor.
