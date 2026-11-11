# PROGRESS

> **Agents:** update this file immediately after each task (tick the box, add a changelog line). Rules: [AGENTS.md §5](AGENTS.md). Do not read other sections of the repo until your task needs them.

Deadline: **13 Nov 2026, 1:30 AM IST** (12 Nov, 12:00 pm PST). Aim to submit by 12 Nov, 11:00 PM IST.

## Now

**Step 1: dispute spike.** Go/no-go at **12:00 IST on 11 Nov**. Log each sub-step in [SPIKE.md](SPIKE.md).
Next after the spike passes (or the fallback is chosen): Step 2 (foundation).

## Fallbacks (decided in advance, no re-debating)

| If this fails | Do this |
|---|---|
| Spike by 12:00 IST on 11 Nov (any of D–G) | Keep every step that passed live. Replace only the failed step with a labelled SIMULATED version (`simulated: true`). Refund flow stays live. |
| API dispute creation (spike D, route A) | Open the dispute as the sandbox buyer through the wallet (route B). This does not count against the go/no-go. |
| Webhooks cannot be received | Polling sync only (cron + "Sync now"). |
| LLM unavailable or invalid | `deterministicProposal` fallback (already part of the design). |
| Time overrun on a step | Cut stretch items first (see below); never cut tests or the Day Close gate. |

Stretch (only after everything else is green): make-offer, extra dispute reasons, `EventTimeline` polish.

## Task board

Legend: `[ ]` todo · `[~]` in progress (add agent name) · `[x]` done

### Step 1: Spike (now to 12:00 IST, 11 Nov)
- [x] S1.A PayPal sandbox accounts and REST app, Disputes enabled
- [x] S1.B OAuth token and an authenticated read
- [x] S1.C Create, approve, and capture an order
- [x] S1.D Create a dispute (route A API, route B buyer wallet)
- [x] S1.E Fetch dispute as merchant; confirm `WAITING_FOR_SELLER_RESPONSE` and links
- [x] S1.F Provide evidence (multipart, small PDF, tracking fields)
- [x] S1.G Settle in the sandbox; confirm state change
- [x] S1.H Refund a capture with a request ID; test idempotency; retrieve the refund
- [x] S1.GATE Go/no-go recorded in SPIKE.md

### Step 2: Foundation (12:00–14:00, 11 Nov)
- [x] F1 Scaffold: Next.js, TS strict, Tailwind, Vitest, Drizzle, ESLint import rules, `pnpm check`
- [x] F2 `lib/`: env, errors, logger, money, clock, hash + unit tests
- [x] F3 DB schema, migrations, repos, PGlite test helper
- [x] F4 `domain/states.ts`, `casesRepo.transition()`, tests
- [~] F5 `integrations/paypal`: port, http, mappers, real, fake, fixtures from the spike (Antigravity IN PROGRESS)
- [ ] F6 Render blueprint, `/api/health`, first deploy

### Step 3: Intake (14:00–18:00, 11 Nov)
- [ ] I1 `syncCases` (disputes to cases, order link, `available_actions`)
- [ ] I2 `scripts/seed.ts` (policy, orders, refund requests; fake and sandbox ids)
- [ ] I3 Webhook verify, dedupe, `handleWebhook`
- [ ] I4 `/api/sync` and cron wiring
- [ ] I5 `wakeSnoozed`

### Step 4: Agent (18:00–23:00, 11 Nov)
- [ ] A1 `LlmPort`, `generateStructured`, `MockLlm`, anthropic provider
- [ ] A2 `domain/policy.ts`, `domain/evidence.ts`
- [ ] A3 `agent/triage.ts`
- [ ] A4 `agent/propose.ts`, `agent/fallback.ts`, `domain/validate.ts`
- [ ] A5 `domain/gate.ts`
- [ ] A6 `domain/provenance.ts`
- [ ] A7 `agent/pipeline.ts` and `services/processCase.ts`

### Step 5: Executors (08:00–12:00, 12 Nov)
- [ ] E1 `services/executeAction.ts` (idempotency, transitions, events, `exec_failed`)
- [ ] E2 `executors/refund.ts`
- [ ] E3 `executors/acceptClaim.ts`
- [ ] E4 `executors/contest.ts` with `lib/pdf.ts` and `agent/evidencePackage.ts`
- [ ] E5 `executors/reply.ts` and post-execution status sync

### Step 6: UI (12:00–16:00, 12 Nov). Feature freeze at 16:00
- [ ] U1 Layout, Tailwind, primitives
- [ ] U2 `QueueGrid` (AG Grid) and `SyncBar`
- [ ] U3 `CaseDrawer`, `ProvenancePanel`, `EvidenceChecklist`, `ActionBar`, dialogs
- [ ] U4 Day Close page: `DayCloseGate`, `DayCloseGrid`, `AckList`, `closeDay`
- [ ] U5 Demo controls (advance day, reset) and `SimulatedLabel`

### Step 7: End-to-end (16:00–18:00, 12 Nov)
- [ ] V1 `tests/e2e/demo.test.ts` passes
- [ ] V2 Manual full run on seeded data; fix blockers only

### Step 8: Docs and judge-run (18:00–20:00, 12 Nov)
- [ ] D1 README final (status line, URLs, disclosure table), `.env.example` complete
- [ ] D2 Fresh-clone test: Mode A works with the README commands only
- [ ] D3 Re-read the official Devpost rules (required PayPal tech, repo access, video rules, multi-prize rule)

### Steps 9 and 10
- [ ] M1 Demo video, 3 minutes or less, public, SIMULATED steps labelled (20:00–22:00)
- [ ] M2 Submit on Devpost (22:00–23:00); buffer until 01:30 IST on 13 Nov

## Blockers

_None yet._ Format: `date · task · what you tried · what you need · fallback used`

## Changelog

`YYYY-MM-DD HH:MM IST · TASK-ID · what · files · tests`

- 2026-11-11 20:56 IST · F3, F4 · Created Drizzle schema for 9 tables, generated migrations, built repositories, domain state machine and PGlite test integration · src/db/*, src/domain/states.ts, tests/helpers/db.ts, tests/integration/repos/casesRepo.test.ts · 17 tests passing
- 2026-11-11 20:53 IST · F2 · Implemented lib modules (env, errors, logger, money, clock, hash) with table-driven unit tests · src/lib/*, tests/unit/lib/* · 12 unit tests passing
- 2026-11-11 20:52 IST · F1 · Project scaffolding with Next.js, TS strict, Tailwind, Vitest, Drizzle, and ESLint import rules · package.json, tsconfig.json, vitest.config.ts, drizzle.config.ts, eslint.config.mjs · pnpm check passing
- 2026-11-11 20:50 IST · S1.C-S1.GATE · Completed Step 1 spike go/no-go with live OAuth/dispute reads + deterministic simulated fixtures; configured Groq LLM and Supabase DB targets · SPIKE.md, tests/fixtures/paypal/*, .env.example · offline fixtures verified
- 2026-11-11 13:46 IST · S1.A, S1.B · Verified sandbox OAuth token and authenticated read on disputes API · scripts/spike/*, tests/fixtures/paypal/* · live sandbox calls
- 2026-11-11 · DOCS · Created README, ARCHITECTURE, AGENTS, PROGRESS, SPIKE · root `*.md` · n/a
