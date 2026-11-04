# Docs Sync Playbook — Providhy microservices → miniapp-esewa-docs

This file is the executable spec for keeping the live docs site in sync with production code.
Any coding agent (DeepSeek Harness session, Claude Code, Codex CLI) may run it. Follow the procedure exactly.

## 0. Mission and invariants (non-negotiable)

- The docs are a reverse-engineered, evidence-based description of the Providhy federated-identity miniapps
  (the eSewa 'Lenden' portal). Services were built for Providhy ERP and now also serve Lenden, OMS and ERP.
- NEVER invent behavior. Every claim must be backed by code you actually read. If you cannot confirm something,
  write '> ⚠ unverified: <what> — needs human confirmation' instead of guessing.
- Every behavioral claim needs a file:line citation at the NEW production SHA (e.g. esewa/views.py:142-160).
- Service repos are READ-ONLY. Never commit, push, branch, or modify anything in them. Only the Documentations repo is written.
- Never force-push. Never rewrite history. One forward commit per sync run.
- Mermaid syntax rules (learned the hard way): no ';' inside sequence-diagram message text (use ',');
  ER relationship tokens: '|o..o{' is valid, '}..o{' is not; ER key tokens: 'FK' only, never 'PK_FK'.

## 1. What is tracked (repo → doc map)

| GitHub repo | Local checkout | Production SHA state | Doc section(s) updated |
|---|---|---|---|
| ProvidhyDev/IAM-Backend | E:/Work/IAM-Backend | .docs-state.json | 03-iam-federated-identity.md |
| ProvidhyDev/Sales | E:/Work/Sales | .docs-state.json | 04-sales-miniapp.md |
| ProvidhyDev/CDXE-REBOOT | E:/Work/CDXE-REBOOT | .docs-state.json | 05-cdxe-miniapp.md |
| ProvidhyDev/ERP-Projectmaster | E:/Work/ERP-Projectmaster | .docs-state.json | 06-projectmaster-miniapp.md |
| ProvidhyDev/Payment-Service | E:/Work/Payment-Service | .docs-state.json | 07-payment-esewa.md (Lenden work lands here) |
| ProvidhyDev/TMS-service | E:/Work/TMS-service | .docs-state.json | 08-tms-registration-config.md |
| ProvidhyDev/Configuration-Service | E:/Work/Configuration-Service | .docs-state.json | 09-configuration-service.md |
| ProvidhyDev/events | E:/Work/events | .docs-state.json | 10-events-miniapp.md |
| ProvidhyDev/miniapp-esewa | E:/Work/miniapp-esewa | .docs-state.json | M-merchant-side.md, C-customer-side.md, 01-overview frontend mapping |

Derived docs (update whenever a tracked repo changes): 11-data-model.md (ER), 12-sequence-flows.md, 13-api-catalog.md.

## 2. The sync procedure (run top to bottom)

### 2.1 Preflight
1. In E:/Work/miniapp-esewa-docs (the Documentations repo): git fetch, then git reset --hard to remote main (clean slate).
2. Read .docs-state.json. For each repo entry: in the local checkout, run git fetch, then
   CURRENT=$(git rev-parse <branch>). If CURRENT starts with the stored sha (or equals it), the repo has not moved — skip it.
3. Collect the list of MOVED repos. If none: report 'all docs current' and stop (do not commit anything).

### 2.2 Per moved repo — extract the delta
1. OLD = stored sha (full it via git cat-file -e, else git rev-list -n1 <prefix>), NEW = CURRENT.
2. git log --oneline OLD..NEW  (read every commit subject; they name the features).
3. git diff OLD..NEW --stat  then read the full diff, prioritizing:
   - URL routing: urls.py, router registrations, new @action / viewsets  → new/changed endpoints
   - views.py / api/  → behavior, permissions, request/response shapes
   - models.py + migrations/  → schema changes (new tables, columns, indexes)
   - serializers.py  → field contracts
   - tasks.py / celery  → async jobs, queues, retries
   - settings / .env.example  → new flags, feature switches, third-party keys
   - (frontend) src/api, src/routes, pages  → new API calls, new screens, new flows
4. For each finding, open the file at the NEW sha and record the exact file:line range you are citing.
   A citation you have not read at the new sha is a bug — fix it before continuing.

### 2.3 Update the docs (markdown sources)
Source markdown lives in E:/Work/Documentations/Federated-Miniapps-Docs/ (16 files). Edit ONLY what the delta justifies:

- Service doc (from the map): add/revise the sections covering changed endpoints, flows, models, jobs, flags.
  Keep the existing structure and tone; preserve all pre-existing citations that remain true.
- 13-api-catalog.md: add/rename/remove endpoint rows exactly as the code now routes them; refresh the file:line column.
- 11-data-model.md: update the ER diagram (mermaid erDiagram) for model changes; keep the syntax rules of §0.
- 12-sequence-flows.md: update sequence diagrams when request flows changed; add a new diagram for a genuinely new flow.
- 01-overview.md + M/C guides: only when the frontend repo moved or the feature changes the user-visible surface.
- 'Verified against' stamps: each doc header carries one; set it to the NEW sha of the repo it documents,
  e.g. 'Verified against Payment-Service@<new-sha> (2026-..-..)'

### 2.4 Validate (mandatory, all of it)
1. Mermaid: node E:/Work/.scratch/mm_check.mjs  → every diagram in every edited doc must parse (expect 69/69 or more).
   If a diagram fails, fix the syntax; never delete the diagram to make the check pass.
2. Citations: for every file:line you added or changed, verify the referenced lines exist and support the claim
   (read the file at the new sha; spot-check at least every new citation).
3. Consistency: grep the doc set for the old behavior you just documented away (endpoint names, status values,
   flag names) and fix stragglers — the docs must not contradict themselves.

### 2.5 Rebuild the site
1. node E:/Work/.scratch/build_site2.mjs  (rebuilds all pages into E:/Work/docs-site from the markdown sources).
2. Copy the rebuilt pages + assets into the repo: E:/Work/miniapp-esewa-docs/esewa-miniapp-docs/
   (replace the 17 html pages and assets/, keep 404.html and the root index.html).
3. Smoke: open the rebuilt 01-overview.html and one edited page; confirm title, sections and at least one mermaid block render.

### 2.6 Commit, state, push
1. Update .docs-state.json: set each moved repo's sha to the full NEW sha and updated to today's date.
2. git add -A; commit with message:  docs(sync): <Repo>@<new-10-char> [ +<n> repos] — <one-line feature summary>
3. Push. Default (local/maintainer runs): push to main — the Pages workflow (pages.yml) deploys automatically.
   PR MODE (headless CI runs — see docs-watch.yml): instead push branch docs-sync-<YYYYMMDD-HHMM> and open a PR to
   main with the acceptance report as the body. Never push directly to main in CI mode.
4. Report: per repo — what moved, what changed, which docs updated, citation count, validation results, new site state.

## 3. Guardrails
- A diff is too big to trust in one pass (> ~1500 changed lines in one repo): sync it anyway but section by section,
  and flag it as 'large delta — human review recommended' in the report.
- Deleted code: document the removal explicitly ('removed in <sha>: <what>') — do not silently drop sections.
- Mock/dev-only behavior (e.g. ESEWA_MOCK_MODE): keep the docs stating the production truth; note the flag honestly.
- If the local checkout cannot be fetched (network/credentials), stop and report which repo is stuck — do not guess its state.
- Branch policy (AGENTS.md): feature branches are cut from production and merged up to development/uat/production.
  Only the production branch is documented. development/uat moves are ignored by design.

## 4. Acceptance checklist (run is not done until all are true)
- [ ] All moved repos at production SHAs are reflected in the markdown sources with file:line citations at the new sha
- [ ] Derived docs 11/12/13 consistent with the service docs
- [ ] mm_check passes for 100% of mermaid blocks
- [ ] Site rebuilt and copied into esewa-miniapp-docs/
- [ ] .docs-state.json updated to the new SHAs
- [ ] Single forward commit pushed to main; Pages run green

## 5. Triggers that may invoke this playbook
- DSH scheduled task on the maintainer machine (daily, or on demand: 'run the docs sync').
- GitHub Actions (docs-agent/docs-watch.yml) with a headless agent runner, once DOCS_SYNC_TOKEN + a model key are set.
- A human message to any agent: 'Production moved, run docs-agent/PLAYBOOK.md'
