# ClinSight

ClinSight is a React and TypeScript clinical documentation application built with Vite. It supports patient intake, charts, orders, notes, handoffs, and clinical assistance.

## Quick start

Requires Node.js 26.11.1 and npm. The exact version is recorded in `.nvmrc` and used by CI.

```sh
npm ci
npm run dev
```

For local AI development, add `GEMINI_API_KEY=your-development-key` to an ignored `.env.local` file and restart Vite. The current integration exposes the key in browser code. Use only a development key; private/production credentials require a server-side integration, which is deferred.

## Project guidance

- [Agent workflow](AGENTS.md)
- [Design entry point](DESIGN.md)
- [Architecture and ownership](docs/architecture.md)
- [Documentation index](docs/README.md)
- [Development and commands](docs/development.md)
- [Testing](docs/testing.md)
- [Work tracking](docs/work/README.md)

Patient data is stored in browser local storage. It is not a managed database or backup. See [data and persistence](docs/data-and-persistence.md) and [operations](docs/operations.md).
