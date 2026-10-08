# Documentation

Start with [the repository guide](../AGENTS.md) when working with an agent, [the design entry point](../DESIGN.md) for design context, or the [project README](../README.md) for the quick start.

## Topics

- [Architecture](architecture.md): repository ownership, dependency boundaries, data flows, and invariants.
- [Design system](design-system.md): visual foundation, shared UI conventions, and interaction behavior.
- [Development](development.md): prerequisites, setup, configuration, and common commands.
- [Testing](testing.md): checks by change type and CI behavior.
- [Product workflows](product.md): implemented screens and primary journeys.
- [Data and persistence](data-and-persistence.md): patient records, migrations, attachments, and import/export.
- [AI integration](ai-integration.md): gateway, tasks, provider transport, and credential limitations.
- [Operations](operations.md): build/preview, troubleshooting, and operational constraints.
- [Work tracking](work/README.md): task record lifecycle and template.
- [Ongoing work](work/ongoing/): planned, active, and blocked deliverables.
- [Completed work](work/done/): completed, cancelled, and superseded records.

## Where information belongs

Keep one authoritative copy: architecture details in `docs/architecture.md`; UI conventions in `docs/design-system.md`; repository invariants and agent workflow in `AGENTS.md`; topic facts in the matching page above; and progress, acceptance, and verification evidence in a task record. `DESIGN.md` is the design entry point. Add a new page only for a distinct reader need. Link to code and tests instead of copying their full contents. Keep examples and history concise; exclude transcripts, raw tool output, repeated check results, and generated inventories.
