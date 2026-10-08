# Development

## Requirements

- Node.js 26.11.1 (the CI version; Node 26 is currently the Current release line, while Node 24 is LTS)
- npm

## Set up and run

```sh
npm ci
npm run dev
```

Vite listens on port 3000 and binds to `0.0.0.0` by default. To use AI features in local development, create an ignored `.env.local` containing `GEMINI_API_KEY=your-development-key`, then restart Vite. The current build exposes this value to browser code; use a development-only key and see [AI integration](ai-integration.md).

## Common commands

| Command                     | Purpose                                                                 |
| --------------------------- | ----------------------------------------------------------------------- |
| `npm run dev`               | Start Vite development server                                           |
| `npm run typecheck`         | Run TypeScript without emitting files                                   |
| `npm run lint`              | Run typecheck and ESLint with warnings treated as errors                |
| `npm run format:check`      | Check Prettier formatting                                               |
| `npm run format`            | Format supported files                                                  |
| `npm test`                  | Run Vitest once                                                         |
| `npm run test:watch`        | Run Vitest in watch mode                                                |
| `npm run build`             | Build production assets to `dist/`                                      |
| `npm run check:bundle-size` | Report production JavaScript sizes and fail if any chunk reaches 500 kB |
| `npm run preview`           | Serve the production build locally                                      |
| `npm run test:e2e`          | Run Playwright Chromium desktop and mobile projects                     |
| `npm run build:test`        | Build with provider calls disabled and no local secrets                 |
| `npm run docs:check`        | Validate required documentation and local links                         |
| `npm run check:dead-code`   | Report unused files, exports, and dependencies                          |

See [testing](testing.md) for selecting checks. The Playwright web server builds with `npm run build:test` and starts Vite preview on port 4173 with external traffic blocked. The test build never loads local environment files and makes the Gemini transport reject before creating its SDK client.

## Environment and configuration

Vite reads environment files and maps `GEMINI_API_KEY` to the client bundle in `vite.config.ts`. `.env.local` is ignored by Git. Never commit a key or use a private/production key in this client-side arrangement. App model defaults and shared UI configuration live in `src/config/appConfig.ts`.

## Troubleshooting

- Vite's large chunk warning compares each minified JavaScript chunk against its default 500 kB limit before gzip; CSS and font assets do not trigger it. `src/App.tsx` loads non-dashboard views on navigation, chat and legal dialogs on first open, and AI task modules on request. The React runtime and KaTeX use named vendor chunks; the clinical Markdown and math pipeline remains fully available on first render when a feature requests it. Run `npm run check:bundle-size` after a production build to list chunk/startup/total sizes and guard the default per-chunk limit.
- If environment changes do not appear, restart Vite.
- If browser tests cannot start, check whether port 4173 is already occupied and whether Playwright Chromium is installed.
- If `npm ci` fails after package metadata changes, confirm `package.json` and `package-lock.json` are both committed and use Node 26.11.1 from `.nvmrc`.
- Browser storage belongs to the active browser origin/profile. Clearing it removes locally stored patient data; see [data and persistence](data-and-persistence.md).
