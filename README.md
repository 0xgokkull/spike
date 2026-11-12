# Spike

> A daily, deadline-driven queue where an AI agent resolves PayPal refund requests and disputes for small online sellers. It acts on its own inside limits the seller sets, and asks before anything material.

**Status:** Feature complete for the PayPal AI Hackathon 2026. All 51 unit, integration, and end-to-end tests passing. **Sandbox only. There is no live-money mode.**

| Doc | Read it for |
|---|---|
| [README.md](README.md) | What the product is, how to run it, how it maps to the judging criteria (this file) |
| [ARCHITECTURE.md](ARCHITECTURE.md) | File structure, components, system design, contracts |
| [AGENTS.md](AGENTS.md) | Rules and workflow for AI coding agents working on this repo |
| [PROGRESS.md](PROGRESS.md) | Task board, blockers, changelog |
| [SPIKE.md](SPIKE.md) | Results of the PayPal dispute spike (what was proven live) |

---

## 1. The problem

A small online seller handles two kinds of "give the money back" work, and both are scattered:

- **Disputes** opened by buyers inside PayPal. They have response deadlines, need the right evidence for the dispute reason, and are easy to lose by answering late or answering badly.
- **Refund requests** that arrive as messages. Each one needs a judgement call against the seller's own policy.

The work is repetitive, deadline-driven, and every outcome is a PayPal action. That makes it a good fit for an agent, as long as the agent cannot move money outside limits the seller controls.

## 2. What Resolution Desk does

The seller opens one screen, **Today**. It lists every open case, sorted by deadline and amount at risk. For each case:

1. The agent reads the buyer message, the order record, the tracking record, and the seller's plain-English refund policy.
2. It proposes **one** action and cites the policy clause behind it.
3. Deterministic code validates the proposal and decides whether it may run automatically or needs approval.
4. The seller **approves, edits, or snoozes (with a date)**. There is no dismiss button.
5. The action executes through PayPal (sandbox) and the case status and event history update.
6. **Day Close** unlocks only when nothing actionable is left and every automatic action has been acknowledged.

### Actions

| Action | What it does in PayPal | AI's role |
|---|---|---|
| **Refund** (full or partial) | Refunds the captured payment | Decides eligibility, amount, policy clause, rationale |
| **Contest with evidence** | Submits evidence on the dispute | Writes the narrative; evidence facts come from order/tracking records only |
| **Accept claim** | Concedes the dispute to the buyer | Explains why conceding is the lowest-risk option |
| **Reply** (local only) | No PayPal call; resolves a case with a drafted message | Drafts the message |

## 3. Supervised autonomy

The agent may act alone in exactly one situation. Everything else waits for the seller.

| Situation | Who acts |
|---|---|
| Refund, amount at or under the seller's cap, policy allows the reason, tracking does **not** show delivery | Agent executes automatically; seller acknowledges at Day Close |
| Any other refund | Seller approval |
| Contest with evidence | Always approval |
| Accept claim | Always approval (it concedes to the buyer) |
| Reply | Always approval (no money moves, but it speaks for the seller) |

The auto-vs-approval decision is **deterministic code**. The LLM cannot change it, and the UI shows why each case got its mode.

## 4. Why a seller opens it every day (and what we can honestly claim)

- Disputes carry deadlines, so the queue is ordered by urgency and unresolved cases carry over, ranked first.
- Refunds and dispute responses have to happen in PayPal. This is the one place where they are decided, executed, and logged.
- Every case ends in a decision. Snooze requires a date, so nothing quietly disappears.
- Day Close is a daily checkpoint: it stays locked until the queue is empty and automatic actions are acknowledged.

We demonstrate the loop. We do not claim measured daily usage; a hackathon-length build cannot prove retention.

## 5. Demo (3 minutes or less)

| Time | What the video shows |
|---|---|
| 0:00 | The problem in two sentences |
| 0:15 | Today queue with seeded cases, sorted by deadline and amount at risk |
| 0:35 | A small refund request is refunded automatically under policy; the case shows the PayPal refund ID |
| 1:05 | A "not received" dispute: agent proposes contest, provenance shows tracking delivered and evidence 6/6 |
| 1:30 | Seller approves; evidence goes to PayPal; dispute is settled in the seller's favour in the sandbox |
| 2:05 | A larger refund is snoozed with a date; "advance day" brings it back |
| 2:25 | Day Close: locked until the queue is empty, then acknowledge automatic actions and close |
| 2:50 | One-line wrap-up |

Any step that could not be run live is labelled **SIMULATED** on screen.

## 6. How PayPal is used

| Capability | Mechanism |
|---|---|
| Refund a capture (full or partial) | PayPal Agent Toolkit `create_refund` |
| List and read disputes | Agent Toolkit `list_disputes`, `get_dispute` |
| Accept a dispute claim | Agent Toolkit `accept_dispute_claim` |
| Record shipment tracking | Agent Toolkit `create_shipment_tracking` |
| Provide dispute evidence | Disputes REST `POST /v1/customer/disputes/{id}/provide-evidence` (the toolkit has no evidence tool) |
| Settle a test dispute (demo only) | Disputes REST sandbox settle call |
| Stay in sync | Webhooks (signature verified, de-duplicated) plus polling fallback |

We use the toolkit wherever it covers the action and direct REST where it does not. Details and verified facts: [ARCHITECTURE.md §11](ARCHITECTURE.md).

## 7. How AI is used

| The LLM does | The LLM never does |
|---|---|
| Classifies the buyer's issue and extracts the claim | Executes anything |
| Proposes one action, an amount, and a policy clause | Decides auto vs approval |
| Writes the rationale, evidence narrative, and message drafts | Supplies carrier, tracking number, order ID, amount, dates, or refund ID |
| | Estimates a win probability (we show evidence completeness, reason, amount at risk, policy match) |

Every proposal is checked by code (action available, clause exists, amount valid, evidence complete for contests). If the LLM fails or violates a rule, a deterministic fallback proposes instead, so the queue never blocks. Buyer messages are treated as untrusted text.

## 8. Tech stack

| Area | Choice |
|---|---|
| App | Next.js (App Router), TypeScript strict |
| UI | Tailwind CSS, AG Grid (queue and Day Close ledger), SWR |
| Data | Postgres, Drizzle ORM and migrations |
| Validation | Zod at every boundary |
| PayPal | `@paypal/agent-toolkit` plus direct Disputes REST |
| LLM | Pluggable provider (`anthropic`, or `mock` for tests and offline demo) |
| PDF | `pdf-lib` (deterministic delivery receipt from order data) |
| Tests | Vitest, MSW, PGlite (in-process Postgres), Testing Library |
| Hosting | Render (web service, Postgres, cron) |

## 9. Quick start

Requirements: Node 20+, pnpm 9+, Docker (for local Postgres) or any Postgres URL.

### Mode A: no credentials (fake PayPal, mock LLM)

Good for judges and for development. The UI shows a **SIMULATED PAYPAL** badge.

```bash
pnpm install
cp .env.example .env.local      # set PAYPAL_MODE=fake and LLM_PROVIDER=mock
pnpm db:up && pnpm db:migrate
pnpm seed
pnpm dev                        # http://localhost:3000
```

### Mode B: real PayPal sandbox

1. At developer.paypal.com, create sandbox **Business** (seller) and **Personal** (buyer) accounts.
2. Create a sandbox REST app, **enable Disputes** in its feature options, and copy the client ID and secret.
3. In `.env.local` set `PAYPAL_MODE=sandbox`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`. `PAYPAL_WEBHOOK_ID` is optional because polling works without webhooks.
4. `pnpm spike:orders` creates sandbox orders and prints buyer approval links. Approve each as the buyer; the script then captures them and writes `scripts/sandbox-orders.json`.
5. Open at least one dispute as the sandbox buyer (wallet dispute flow, or the API if your account has access), then run `pnpm sync`.
6. `pnpm seed:sandbox`, then `pnpm dev`.

For a real LLM, set `LLM_PROVIDER=anthropic`, `LLM_API_KEY`, and `LLM_MODEL`. Without them use `LLM_PROVIDER=mock`.

## 10. Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | Postgres connection string (Supabase or local Postgres) |
| `NEXT_PUBLIC_SUPABASE_URL` | optional | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | optional | Supabase public anonymous key |
| `PAYPAL_MODE` | yes | `sandbox` or `fake` |
| `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` | sandbox mode | PayPal Sandbox REST app credentials |
| `PAYPAL_WEBHOOK_ID` | optional | Enables webhook signature verification |
| `LLM_PROVIDER` | yes | `groq`, `anthropic`, or `mock` |
| `GROQ_API_KEY` / `LLM_API_KEY` | groq / anthropic | Provider credentials |
| `LLM_MODEL` | optional | Model ID (`qwen/qwen3.8-27b`, etc.) |
| `APP_BASE_URL` | yes | Public URL, used for links and webhook setup |
| `DEMO_MODE` | optional | `true` enables `/api/demo/*` (advance day, reset) |

Env is parsed once in `src/lib/env.ts`. Never read `process.env` elsewhere.

## 11. Scripts

| Script | Does |
|---|---|
| `pnpm dev` / `build` / `start` | Next.js dev, build, serve |
| `pnpm check` | Typecheck + lint + unit/integration tests (must be green before any commit) |
| `pnpm test` | Unit and integration tests (offline, deterministic) |
| `pnpm test:sandbox` | Opt-in live PayPal sandbox tests (needs credentials) |
| `pnpm db:up` / `db:generate` / `db:migrate` | Local Postgres, generate and apply migrations |
| `pnpm seed` / `seed:sandbox` | Seed policy, orders, refund requests (fake or sandbox ids) |
| `pnpm sync` | Pull disputes from PayPal and process new cases |
| `pnpm spike` / `spike:orders` | PayPal dispute spike steps; create and capture sandbox orders |
| `pnpm demo:reset` | Reset demo data and the simulated clock |
| `pnpm e2e:demo` | Runs the full demo flow at service level against mocks |

## 12. Testing

- Every function with logic has a test written in the same change.
- `pnpm test` never touches the network. PayPal is mocked with MSW fixtures that came from real sandbox responses; the LLM is mocked with `MockLlm`.
- Live checks live under `tests/sandbox/` and run only with `pnpm test:sandbox`.
- Details: [ARCHITECTURE.md §15](ARCHITECTURE.md).

## 13. Deployment (Render)

`render.yaml` provisions a web service, a Postgres database, and a cron job that calls `POST /api/sync` every minute. Migrations run before start. After deploy, add `https://<your-app>.onrender.com/api/webhooks/paypal` as a webhook in the sandbox app and subscribe to dispute and refund events. The app works without it, using polling.

## 14. Scope

**In:** one seller, the Today queue, the case view with provenance, Day Close, three executable PayPal actions plus a local reply, webhooks with polling fallback, a simulated clock for the demo.

**Out (deliberately):** authentication and multi-user, multi-currency, analytics, real email or SMS, make-offer and escalation, chargebacks from banks, anything that touches live money.

## 15. Known limitations (read before judging)

- Sandbox only. No live-money switch exists.
- Single seller, no authentication. Production would add seller auth and role-based access.
- USD only.
- Contest is supported for the "item not received" reason. Other reasons can be refunded or conceded only.
- PayPal limits dispute creation through the API to limited-release access, so test disputes may need to be opened from the sandbox buyer's wallet.
- Evidence facts come from the seller's order and tracking records, which are seeded in the demo.
- Any step that was not run live is labelled SIMULATED in the UI and in [SPIKE.md](SPIKE.md).

## 16. Hackathon alignment

PayPal AI Hackathon 2026 judges on technological implementation, design, potential impact, innovation, and presentation. We are also aiming at **Best Use of PayPal + AI** and **Best Use of Agentic Commerce**, and use AG Grid and Render as sponsor technologies.

| Criterion | Where it shows |
|---|---|
| Technological implementation | Real sandbox flow, toolkit plus REST split, idempotent executors, signed webhooks, tested core |
| Design | One screen, provenance for every recommendation, explicit auto-vs-approval reasons |
| Potential impact | Deadline-driven money-back work that small sellers handle by hand |
| Innovation | Supervised autonomy: the agent acts inside seller limits, code (not the LLM) holds the gate |
| Presentation | Three-minute loop: queue, auto refund, contested dispute, Day Close |

## 17. AI tools and services disclosure (complete before submission)

| Component | Tool / model | Role |
|---|---|---|
| Runtime LLM | Groq (`qwen/qwen3.8-27b`) | High-speed structured JSON triage, policy-bound proposals, evidence narrative, and buyer message drafting |
| PayPal Integration | `@paypal/agent-toolkit`, PayPal Disputes & Payments REST APIs | Live sandbox capture refunds, dispute evidence submissions, idempotency tracking |
| Development Assistants | Antigravity AI pair programmer | Scaffolding, architecture adherence, test generation, and documentation under [AGENTS.md](AGENTS.md) rules |

License: MIT
