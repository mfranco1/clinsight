# Operations and limitations

The repository defines a Vite development server, production build, and local preview. CI builds and tests the application on pushes and pull requests. No production hosting, server-side patient database, server-side AI proxy, managed backup, or recovery procedure is configured in this repository; deployment-specific operational claims belong with the deployment configuration when one is added.

## Local build and preview

Use `npm ci` with Node 24, then `npm run build` and `npm run preview`. See [development](development.md). The build can include a configured Gemini development key in browser assets, so do not supply a private/production credential. See [AI integration](ai-integration.md).

## Data constraints

Patient charts and some preferences are stored in the browser profile. Browser storage is not a managed backup, multi-user store, or guaranteed recovery mechanism. Clearing the site data or losing the browser profile may remove records. See [data and persistence](data-and-persistence.md).

## Troubleshooting

- Build/type errors: use Node 24, run `npm ci`, then inspect `npm run lint` and `npm run build` output.
- Browser test startup: verify Chromium is installed and port 4173 is available.
- AI feature errors: verify a development key is configured locally and the browser has network access; do not paste prompts, patient data, or keys into issue logs.
- Missing local patient records: verify the same browser profile and origin are in use. No server copy or recovery path is implemented here.
