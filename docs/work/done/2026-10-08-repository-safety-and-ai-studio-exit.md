# Repository safety and Google AI Studio exit

Status: done
Owner: Codex
Updated: 2026-10-08

## Goal

Remove obsolete Google AI Studio scaffolding and establish evidence that the complete intended GitHub push, including its history, contains no exposed secrets or private clinical data, while preserving current AI-assisted workflows.

## Scope

- All tracked content, index state, historical paths and blobs, commit/tag messages and metadata, branches/tags, and other local refs; explicit coverage of the exact refs intended for publication.
- Credentials, tokens, private keys, credential-bearing URLs, personal/patient information, clinical exports, attachments, screenshots, logs, generated artifacts, and embedded/encoded content.
- AI Studio-specific metadata, branding, links, host bridges, iframe assumptions, setup instructions, configuration, and obsolete assets.
- Repeatable redacted scans and publication gates; coordinate lockfile/dependency changes with the [completed build and dependency plan](../done/2026-10-08-build-and-dependency-health.md).

## Non-goals

- Removing the working Gemini provider merely because it is a Google service. AI Studio hosting/scaffolding and the provider integration are distinct dependencies.
- Silently deleting clinical source context, required licenses/attributions, or truthful architectural/security documentation.
- Implementing a backend or claiming production readiness. The [server-side AI proxy](../ongoing/2026-10-08-server-side-ai-proxy.md) remains separately scoped and deferred.
- Publishing, force-pushing, or rotating account credentials. The user later explicitly authorized rewriting local commit metadata to replace their personal mailbox with their GitHub noreply address; no remote force-push is authorized.

## Acceptance criteria

- [x] Every tracked file and all publication-reachable history are scanned; binaries and encoded content receive appropriate review, with exact scope and tool versions recorded.
- [x] Confirmed exposed credentials are revoked/rotated and private data removed from the publishable repository and history; deletion alone is not considered credential remediation.
- [x] No unresolved secret or private-data finding remains. False positives have narrow, reviewable explanations without reproducing sensitive values.
- [x] Obsolete AI Studio artifacts are removed, and remaining Google/provider references are classified and justified.
- [x] Standalone workflows, browser permissions, AI contracts, clinical meaning, and persisted records remain compatible.
- [x] A clean local clone of the exact proposed publication refs passes final scans and relevant project checks.
- [x] Preventive ignore/scanning/CI guidance is in place, and the separate browser-key production blocker remains explicit.

## Progress

The initial worktree and index were clean at HEAD `405557433b98801934a544ef6fd93c1cb06bddd0`; no Git remote is configured, so publication refs and prior remote exposure cannot yet be verified. The repository is not shallow and has no submodules or Git LFS files. Local scope includes `master`, 8 Codex checkpoint/capture refs, 30 reflog entries, and 243 unreachable Git objects.

Observed on 2026-10-08:

- Local repository is not shallow. `git rev-list --all --count` reports 29 reachable commits, including refs outside the main branch; local Codex checkpoint/capture refs exist alongside `master`.
- Current tracked files include `metadata.json` with `requestFramePermissions`, a candidate AI Studio artifact whose consumers must be checked before removal.
- `vite.config.ts` injects `GEMINI_API_KEY` into browser code. This is documented and remains a production credential blocker regardless of Git scan results.
- `.gitignore` ignores `*.local`, build/test outputs, and dependencies, but has no general `.env`/`.env.*` protection. Ignore rules do not remove already tracked or historical content.
- `index.html` loads Google Fonts; two print dialogs load hosted Tailwind scripts. These are external asset dependencies to classify, not proof of AI Studio coupling.
- No explicit AI Studio branding was found in the limited current-file search. Full tracked-content and history scanning has not run. Tracked screenshot fixtures also require review.

Audit findings and work completed on 2026-10-08:

- Gitleaks 8.30.1 reported zero findings for all refs/reflog commits (`--all --reflog --full-history`), for 239 indexed and 239 working-tree tracked files, and for 100 unreachable blob objects. The complete object database contained 892 unique blobs; its only binary objects are two dashboard PNG snapshots. Both show an empty patient list and no patient data. No tracked archives, PDFs, database files, or attachment binaries were present. Pattern review found no phone-number or SSN-shaped values; email literals are confined to application contact/demo fields and dependency metadata.
- One personal mailbox appeared in commit author/committer metadata. The user supplied their GitHub noreply address and authorized replacing the mailbox in local publication history. `master` has now been rewritten; all 60 author/committer email fields across its 30 commits use the supplied noreply address.
- The hard-coded clinician display identity is the user's own name, and the user explicitly approved retaining it.
- Current runtime code has no AI Studio host bridge or runtime dependency. The initial commit contains an AI Studio setup link, AI Studio CDN import-map URLs, and root `metadata.json` permission metadata; these are scaffold provenance in historical snapshots. `metadata.json` has no consumer and is removed from the current tree. Google Fonts and print-dialog CDN resources remain classified as independent third-party asset dependencies, not AI Studio hosting.
- Added ignore protection for environment/config credentials, private keys, local clinical exports/data/attachments, and local audit output. Added a full-history Gitleaks CI job with findings comments, summaries, and uploaded artifacts disabled, plus a documented redacted local scan command.
- The linked `origin` is `github.com/mfranco1/clinsight` and advertises no branches or tags (`git ls-remote --heads --tags origin` returned no refs). There is no remote history to compare and no evidence from this clone about forks, prior pushes, or other copies. Do not use `git push --mirror`: the app-managed `refs/codex/*` checkpoint refs remain local and were not rewritten. The sanitized publication candidate is `master` at `513b7227aa773c614b5d36eb24a3de567cdd7375`.
- A complete phrase scan found “AI Studio” only in the repository-safety task record; this is retained as truthful audit provenance. Historical application scaffolding and host URLs/CDN markers are absent from `master`. The user's own clinician display name remains by explicit approval.

## Stage 0 — Define scope and protect audit output

1. Record the exact HEAD, index/worktree state, intended GitHub visibility, and proposed branch/tag refspecs. Inspect remote configuration without printing credential-bearing URLs. Establish whether anything was previously pushed or shared.
2. Enumerate all refs, stashes, notes, replace refs, worktrees, alternates, shallow/partial-clone state, submodules, and Git LFS use. Obtain missing history or LFS objects before claiming complete coverage. Include custom local refs in the local audit even if they will not be pushed.
3. Distinguish publication-reachable history from reflog-only/unreachable objects. Inspect the latter locally as potential exposure/reintroduction sources; never use a mirror push that accidentally publishes internal refs.
4. Select a maintained secret scanner with redacted output and full-history coverage, supplemented by targeted patterns and manual private-data review. Verify current scanner flags against its primary documentation before use.
5. Keep raw findings and any contaminated backups outside the repository in restricted local storage. Reports may contain safe paths, object IDs, rule IDs, counts, and remediation state; never secret values, patient text, sensitive screenshots, or raw patches.

Exit gate: auditable coverage inventory and safe reporting procedure. Any inaccessible scope is a blocker to a complete-history claim.

## Stage 1 — Audit tracked content and history

1. Scan the current tracked tree and index, then every relevant historical blob and commit/tag message across all inventoried refs, including deleted/renamed files. Do not limit scanning to the current branch or recent diffs.
2. Check common provider/cloud/GitHub tokens, private keys, certificates with private material, database/auth credentials, `.env` files, npm configuration, URLs with credentials, build artifacts/source maps, archives, base64 payloads, and CI configuration. Do not print matches or validate suspected credentials by making provider calls.
3. Review clinical fixtures, templates, attachments, image snapshots, documents, and Git metadata for personal/private material. Decode/extract eligible assets locally with bounded tooling; text regex searches alone cannot clear binary content. Establish synthetic fixture provenance.
4. Inventory AI Studio references throughout current files and history: studio URLs, generated badges, project identifiers, metadata, injected globals/bridges, iframe messaging, import maps/CDNs, permission configuration, and documentation. Classify active provider code, independent external assets, historical provenance, and obsolete scaffolding separately.
5. Produce a redacted finding register with severity, safe location/object reference, affected refs, exposure status, proposed fix, and verification. Narrowly justify false positives; no broad path exclusions for application code, fixtures, or history.

Exit gate: every candidate is classified; confirmed secrets or private data trigger containment before routine cleanup.

## Stage 2 — Contain exposure and clean the current tree

1. For confirmed credentials, arrange issuer-side revocation/rotation promptly and record completion without values. Account actions requiring the owner remain explicit blockers. Never wait for a history rewrite before revoking an exposed key.
2. If data was already published, determine affected remotes, forks/clones, PRs, caches, releases, and CI artifacts. Coordinate removal with the owners; do not imply a local rewrite recalls distributed copies.
3. Remove obsolete AI Studio metadata, assets, host-specific code, and links after checking their consumers. Preserve native camera/microphone/notification flows and explain any intentional behavior change.
4. Preserve typed Gemini gateway/task/transport behavior and clinician review. Review hosted fonts and print scripts independently; retain or replace based on a concrete standalone/privacy/offline requirement rather than a blanket Google-name search.
5. Strengthen ignore rules for environment files, credentials, exports, and audit output; provide only placeholder examples where needed. Check the index explicitly because ignore rules are not retroactive.
6. Update authoritative setup/AI/operations docs to describe the actual standalone behavior and remaining browser credential limitation. Keep historical records truthful; remove sensitive information wherever it occurs, but do not erase harmless provenance just to make a keyword scan empty.

Verification: rescan the tree/index and relevant generated output without exposing content. Run targeted AI-contract, permission/resource-cleanup, print, and persistence tests for affected paths, plus typecheck/build for application/configuration changes.

## Stage 3 — Remediate history when evidence requires it

1. If no sensitive historical content is found, retain history and record scan evidence. Harmless AI Studio provenance alone does not justify a destructive rewrite. The separately authorized mailbox cleanup is limited to local commit metadata.
2. If required, prepare a concrete rewrite plan in an isolated restricted clone: exact affected paths/blobs/refs, replacement/removal rules, impact on tags/signatures/commit IDs, protected recovery handling, and collaborator coordination. Never place sensitive replacement strings in committed files or terminal output.
3. Obtain explicit authorization for destructive history replacement and any remote force-push before those actions. The user authorized a local history rewrite to replace their personal mailbox with their account-specific GitHub noreply address. No remote force-push has been authorized.
4. Rewrite all affected publishable refs with an appropriate history-filtering tool. Review local backup/custom refs and reflogs that could reintroduce removed objects; do not destroy recovery data indiscriminately. Verify the resulting application tree preserves unrelated work.
5. Rescan rewritten history and inventory remaining contaminated local refs/objects. Keep them out of the publication source and document restricted retention/disposal. Coordinate already-published copy cleanup separately; remaining exposure must be stated.

Exit gate: no sensitive finding remains reachable from any ref selected for publication, revoked credentials cannot be reused, and excluded local contaminated objects cannot accidentally be pushed.

## Stage 4 — Verify independent operation and production boundaries

1. From a clean, credential-free checkout, run local development and production preview outside AI Studio. Verify navigation, synthetic intake/chart/order/note/handoff workflows, import/export/reload, and desktop/mobile UI.
2. Use mocked AI responses to verify task contracts, malformed/error handling, cancellations, and review/edit flows. Preserve the policy that automated tests never call a provider.
3. Run `npm run lint`, `npm test`, `npm run build`, `npm run check:bundle-size`, `npm run build:test`, and `npm run test:e2e` for the final application/configuration changes. Inspect built assets using redacted scans; do not put private credentials into the build.
4. Separate publication safety from production operation: the browser provider key, hosting/authentication, data handling, and recovery limitations remain explicit. Hand credential isolation requirements to the existing proxy tracker; do not silently expand this task into backend implementation.

Exit gate: standalone operation is verified within current boundaries; no unsupported production-safety claim is made.

## Stage 5 — Prevent recurrence and establish publication readiness

1. Add a reproducible redacted secret scan with a documented local full-history command and appropriate CI coverage. Ensure checkout depth/ref coverage matches its claims. Test it with synthetic dummy fixtures, never a real credential.
2. Configure available GitHub secret-scanning/push-protection features when repository access and account capabilities permit; record unavailable controls rather than claiming they exist. These complement local review and do not detect all patient data.
3. Build a clean local clone from exactly the proposed publication refs and rescan all its reachable content/history, including required LFS/submodule content. Re-run after final dependency or documentation changes. Record revision/ref inventory, tool/rule versions, counts, manual review scope, and residual limitations.
4. Run `npm run docs:check`, `npm run format:check`, and applicable project checks. State publication readiness only when findings and coverage gaps are resolved. Do not push as part of this planning request.
5. Record durable prevention guidance in development/testing/operations docs, then move this tracker to `done/` when its acceptance criteria pass. Keep production proxy work separately tracked.

## Verification

Gitleaks 8.30.1 passed against all locally available refs/reflog commits, 238 indexed and 238 working-tree tracked files, unreachable blobs, `dist/`, and rewritten `master`. A separate branch-history check confirmed 30 commits, all 60 author/committer email fields set to the user-provided GitHub noreply address, and zero AI Studio host/CDN/product marker blobs or old mailbox strings reachable from `master`; the sole broad phrase match is the audit tracker noted above. The two tracked screenshots were visually reviewed as empty-dashboard shells. `npm run docs:check`, `npm run format:check`, `npm run lint`, `npm test` (143 tests), `npm run build`, `npm run build:test`, `npm run check:bundle-size`, and `npm run test:e2e` (27 passed, 1 skipped) passed using Node 26.11.1. `git diff --check` passed. The linked remote advertises no heads or tags; publication to GitHub has not occurred, and copies outside the linked remote cannot be established. GitHub-side secret scanning/push protection was not configured from this session; the CI Gitleaks job is the repository-side gate.

## Outcome

The local publication candidate `master` is sanitized and passed the recorded scans. The linked GitHub repository has no refs, no push was made, and Codex-managed refs remain excluded from publication. Remaining limits: remote copies cannot be assessed, and the browser-exposed Gemini key remains a production blocker tracked separately.
