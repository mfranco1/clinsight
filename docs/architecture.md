# Architecture

This describes the current implementation. Future backend work remains explicitly deferred. See [the design entry point](../DESIGN.md) for related documentation.

## Repository ownership

- `App.tsx` composes the application, routes among views, owns cross-feature coordination, and wires patient-store and AI actions. Keep feature-specific state and presentation in the feature that owns it.
- `app/shell/` contains the application navigation, header, and patient header.
- `features/` owns each product workflow and its view-specific components, hooks, and selectors: access, chart, chat, course, dashboard, handoff, input, notes, orders, profile, settings.
- `domain/` contains framework-independent patient transitions, factories, and order rules. It should not import React or browser UI modules.
- `components/ui/` contains reusable presentation primitives; `components/` contains cross-feature components and dialogs.
- `hooks/` contains reusable browser/React lifecycle behavior that is not specific to one feature. Feature-only hooks stay in the feature.
- `services/` owns persistence, files, diagnostics, notifications, and AI integration. Provider-specific code stays under `services/ai/`.
- `config/` owns shared application configuration and clinical template exports; `types.ts` is the shared data contract surface; `utils/` holds focused utilities.

The intended dependency direction is application composition → features → domain/services/shared UI. Domain rules remain usable without the browser. Shared UI must not absorb clinical or feature workflow decisions. Avoid adding barrel/compatibility facades unless migration needs them and has a clear removal path.

## Patient data and persistence flow

`usePatientStore` coordinates patient state. Pure constructors and transitions in `domain/` create/update records; `services/patientPersistence.ts` validates and migrates legacy persisted records and hydrates attachments. `App.tsx` serializes patient state to browser storage and coordinates patient-level preview URL cleanup. Import/export paths are also wired through the app and attachment helpers.

Preserve the storage key and backward-compatible hydration unless a deliberate migration changes them. Runtime `File` objects and blob URLs are not durable values: attachment persistence retains serializable bytes and metadata, recreates runtime files/previews on hydration, and preview owners must revoke URLs on removal/unmount. See [data and persistence](data-and-persistence.md).

## AI request flow

Feature components call typed functions in `services/ai/actions.ts`. Those functions target `ClinicalAiGateway`; `geminiGateway.ts` maps gateway operations to task modules, and `geminiTransport.ts` owns SDK calls and provider-specific transport handling. Task modules own prompts, schemas, parsing, and task result contracts. Keep provider-specific types and behavior behind this seam.

The gateway is an interface boundary inside the client bundle, not a server proxy. Vite injects `GEMINI_API_KEY` into the browser build today. A private credential must not be used with this setup. Moving provider credentials and calls to a server remains explicitly deferred. See [AI integration](ai-integration.md).

## Change constraints

- Preserve clinical data meaning, import/export behavior, and legacy persistence compatibility; update focused fixtures/tests when contracts change.
- Keep AI task inputs/results typed and stable at the feature boundary. Keep error reporting free of raw clinical prompts/responses and sensitive patient details.
- Own media streams, event listeners, timers, object URLs, and other browser resources explicitly and release them with their lifecycle.
- Preserve accessible names, dialog semantics, keyboard behavior, and desktop/mobile layout when changing shared controls.
- Separate structural refactors from user-visible behavior changes where practical; verify the workflows affected by either change.
