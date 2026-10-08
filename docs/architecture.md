# Architecture

This describes the current implementation. Future backend work remains explicitly deferred. See [the design entry point](../DESIGN.md) for related documentation.

## Repository ownership

- `src/App.tsx` composes the application, routes among views, owns cross-feature coordination, and wires patient-store and AI actions. Keep feature-specific state and presentation in the feature that owns it.
- Non-dashboard views and access pages load on first navigation through `src/components/ui/LazyFeature.tsx`; successful modules are shared across wrapper remounts, and selected-view loading/error recovery stays local while `App` retains patient and workflow state. The chat panel and legal dialogs load on first open and retain their mounted state afterward. The main and nested view scroll positions are restored for revisits within the app session, keyed by view and patient/entry identity where applicable.
- `src/app/shell/` contains the application navigation, header, and patient header.
- `src/app/ViewState.tsx` provides small in-memory state for view controls that should survive navigation. Patient-scoped keys include stable patient IDs; logout clears the session cache and patient deletion clears that patient's entries. Do not put clinical records, drafts, or provider responses in this cache; patient data remains owned by the patient store and feature drafts keep their existing persistence owners.
- `src/app/ViewState.tsx` provides small in-memory state for view controls that should survive navigation. Patient-scoped keys include stable patient IDs; logout clears the session cache and patient deletion clears that patient's entries. Do not put clinical records, drafts, or provider responses in this cache; patient data remains owned by the patient store and feature drafts keep their existing persistence owners.
- `src/features/` owns each product workflow and its view-specific components, hooks, and selectors: access, chart, chat, course, dashboard, handoff, input, notes, orders, profile, settings.
- `src/domain/` contains framework-independent patient transitions, factories, and order rules. It should not import React or browser UI modules.
- `src/components/ui/` contains generic presentation primitives, including `RichContent` for safe plain-text/Markdown/HTML display; `src/components/clinical/` contains clinical formatting adapters and inputs; `src/components/dialogs/` contains dialogs reused across features. Other cross-feature overlays and feedback remain in `src/components/`.
- `src/components/ui/editor/` owns the reusable CodeMirror source adapter, Tiptap document editor, visual eligibility/serialization gate, and paste sanitizer. These primitives own editor state and commands only; patient drafts, persistence, attachments, AI actions, and save/cancel decisions remain in their feature owners through `EditableTextArea`.
- `src/hooks/` contains reusable browser/React lifecycle behavior that is not specific to one feature. Feature-only hooks stay in the feature.
- `src/services/` owns persistence, files, diagnostics, notifications, and AI integration. Provider-specific code stays under `src/services/ai/`.
- `src/config/` owns shared application configuration; clinical templates stay with `src/features/input/`. `src/types.ts` is the shared data contract surface; `src/utils/` holds focused utilities.

The intended dependency direction is application composition → features → domain/services/shared UI. Domain rules remain usable without the browser. Shared UI must not absorb clinical or feature workflow decisions. Avoid adding barrel/compatibility facades unless migration needs them and has a clear removal path. Components follow the repository's default-export convention; avoid duplicate named/default exports without named-import consumers.

## Patient data and persistence flow

`usePatientStore` coordinates patient state. Pure constructors and transitions in `src/domain/` create/update records; `src/services/patientPersistence.ts` validates and migrates legacy persisted records and hydrates attachments. `src/App.tsx` serializes patient state to browser storage and coordinates patient-level preview URL cleanup. Import/export paths are also wired through the app and attachment helpers.

Preserve the storage key and backward-compatible hydration unless a deliberate migration changes them. Runtime `File` objects and blob URLs are not durable values: attachment persistence retains serializable bytes and metadata, recreates runtime files/previews on hydration, and preview owners must revoke URLs on removal/unmount. See [data and persistence](data-and-persistence.md).

## AI request flow

Feature components call typed functions in `src/services/ai/actions.ts`. Those functions target `ClinicalAiGateway`; `geminiGateway.ts` maps gateway operations to task modules, and `geminiTransport.ts` owns SDK calls and provider-specific transport handling. Task modules own prompts, schemas, parsing, and task result contracts. Keep provider-specific types and behavior behind this seam.

The gateway is an interface boundary inside the client bundle, not a server proxy. Vite injects `GEMINI_API_KEY` into the browser build today. A private credential must not be used with this setup. Moving provider credentials and calls to a server remains explicitly deferred. See [AI integration](ai-integration.md).

## Change constraints

- Preserve clinical data meaning, import/export behavior, and legacy persistence compatibility; update focused fixtures/tests when contracts change.
- Keep AI task inputs/results typed and stable at the feature boundary. Keep error reporting free of raw clinical prompts/responses and sensitive patient details.
- Own media streams, event listeners, timers, object URLs, and other browser resources explicitly and release them with their lifecycle.
- Preserve accessible names, dialog semantics, keyboard behavior, and desktop/mobile layout when changing shared controls.
- Separate structural refactors from user-visible behavior changes where practical; verify the workflows affected by either change.
