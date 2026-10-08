# AI integration

## Current request path

Feature code calls typed operations in `src/services/ai/actions.ts`, which use the `ClinicalAiGateway` interface. `geminiGateway.ts` connects that interface to task modules under `src/services/ai/tasks/`. Tasks own prompt construction, schemas, parsing, and task-level fallbacks. `geminiTransport.ts` owns the Google SDK request boundary, abort handling, sanitation, grounding extraction, and file conversion. Tests cover gateway actions, task contracts, parsing, and transport.

The gateway dynamically loads the owning task module when an operation is called, keeping prompts, runtime SDK schemas, and transport code out of dashboard startup. Calls remain typed and task modules retain provider-specific behavior behind the same boundary. Chat cancellation is checked after task loading and before provider work begins.

Keep UI/features independent of provider SDK details. Add or change task contracts at the gateway/action/task boundary and cover request mapping, response shape, empty or malformed output, and error behavior as appropriate. Patient summary generation includes the one-liner, active issues, and action items; clinical pearls are not generated. Prescription parsing remains available; home-instructions generation has been removed from the current product. Keep raw prompts, completions, and patient content out of diagnostics.

Tests must never call an AI provider. Vitest rejects unexpected network requests, and the `test` build mode omits local credentials and makes `geminiTransport` fail before constructing the SDK client. Browser tests use a local-only network fixture. Cover AI workflows with synthetic responses and mocked gateway/transport boundaries; there is no live-provider test exception.

## Credential and deployment limitation

`vite.config.ts` reads `GEMINI_API_KEY` and defines it into the client bundle. A browser user can inspect client-delivered credentials. This arrangement is for development with a development-only key; it is not suitable for a private or production credential. A gateway interface in the client does not protect the key.

A server-side proxy was explicitly deferred in the refactoring record. It is future work and requires a separately scoped implementation and deployment decision. Do not report it as complete or infer that the browser integration is production-safe.

## Safety and failure handling

Generated clinical content requires clinician review. Preserve the existing typed result contracts and UI feedback. Diagnostics should describe operational failure without including clinical source text, generated output, credentials, or other patient data. A passing unit test/build does not establish provider uptime, output correctness, or clinical validation.
