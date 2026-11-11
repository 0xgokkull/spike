# AGENTS.md: rules for AI agents working on Resolution Desk

Read this file fully (about 5 minutes). Then read the **"Now"** section of [PROGRESS.md](PROGRESS.md) and your task. **Do not read anything else until your task needs it.** Do not analyse the whole repo.

## 0. Context in 60 seconds

Resolution Desk is a daily queue of PayPal refund requests and disputes. The LLM proposes an action; deterministic code validates it and decides auto vs approval; the seller approves, edits, or snoozes; executors call PayPal (sandbox).

Stack: Next.js App Router (TypeScript strict) · Postgres + Drizzle · Zod · AG Grid · Tailwind · SWR · Vitest (+ MSW, PGlite, Testing Library). Submission deadline: 13 Nov 2026, 1:30 AM IST.

Structure and contracts live in [ARCHITECTURE.md](ARCHITECTURE.md). Use §3 (tree) and §4 (reuse index) instead of exploring.

## 1. Hard rules (locked: never change them)

If you think a rule is wrong, write it under **Blockers** in PROGRESS.md and stop. Do not work around it.

1. **LLM proposes, code disposes.** LLM output never triggers a PayPal call, a state change, or the auto-vs-approval choice.
2. **Gate:** `auto` only for a refund at or under the seller's cap, with an eligible reason, where tracking does **not** show delivery. `contest`, `accept_claim`, and `reply` are always approval.
3. **Evidence facts** (carrier, tracking number, order ID, amount, dates, refund ID) come from DB records only. The LLM writes narrative text only.
4. **No win probability** anywhere. Show evidence completeness, reason, amount at risk, policy match.
5. **Status changes** only through `casesRepo.transition()`. **PayPal-affecting actions** only through `executeAction()`.
6. **PayPal access:** services and executors use `PayPalPort` only. Raw HTTP exists only inside `integrations/paypal/http.ts`.
7. **Money** is integer cents plus currency, USD only. Convert only in `lib/money.ts`.
8. **Sandbox only.** Never add a live-money switch. Never change the pinned base URL.
9. **Offer only actions that are available** (`case.available_actions`: PayPal links plus local rules).
10. **Anything simulated** sets `simulated: true` and shows the SIMULATED label.
11. **No scope creep:** no auth, multi-tenant, new action types, analytics, real email or SMS, make-offer.

## 2. Workflow per task (follow exactly)

1. Open PROGRESS.md. Take the first unchecked task in "Now" (or the one you were given). Write your agent name and `IN PROGRESS` next to it.
2. Find the files through §3 below. Read at most 3 files before coding. Use `rg -n "name" src` instead of opening folders.
3. Write the code **and its tests together**. A task without tests is not done.
4. Run the targeted test: `pnpm vitest run <test path>`. Then run `pnpm check`. Fix until both are green.
5. Optional, if sandbox credentials exist and the task touches PayPal: `pnpm test:sandbox <path>`.
6. **Update docs immediately** (§5), in the same session, before starting another task.
7. Commit: `type(scope): summary [TASK-ID]` (types: feat, fix, test, docs, chore, refactor).
8. Reply in 5 lines or fewer: what changed, tests run, next task.

## 3. Where things live

| I need to… | Go to |
|---|---|
| Change what the agent recommends | `src/agent/propose.ts`, `agent/prompts/propose.ts`, `agent/fallback.ts` |
| Change auto vs approval | `src/domain/gate.ts` and `tests/unit/domain/gate.test.ts` |
| Change a status or transition | `src/domain/states.ts` |
| Change what makes a proposal valid | `src/domain/validate.ts` |
| Change evidence requirements | `src/domain/evidence.ts` |
| Call PayPal | `src/integrations/paypal/port.ts`, then `real.ts` and `fake.ts` |
| Add or change an executor | `src/executors/<name>.ts` and `registry.ts` (see ARCHITECTURE §17) |
| Run an action with idempotency | `src/services/executeAction.ts` |
| Change DB schema | `src/db/schema.ts`, then `pnpm db:generate`, commit `drizzle/` |
| Add an API route | `src/app/api/<x>/route.ts` using `lib/route.ts` `handler()` plus a service |
| Change a screen | `src/ui/components/<Name>.tsx` (pages stay thin) |
| Seed or demo data | `scripts/seed.ts` |
| Mock PayPal in a test | `tests/helpers/paypalMsw.ts` and `tests/fixtures/paypal/` |
| Mock the LLM in a test | `tests/helpers/mockLlm.ts` |
| Add an env var | `src/lib/env.ts`, `.env.example`, README §10 |

## 4. Reuse before you write

| Need | Use | Never |
|---|---|---|
| Change status | `casesRepo.transition()` | `UPDATE cases SET status…` |
| Run an action | `executeAction()` | Call an executor or PayPal directly from a route |
| PayPal calls | `createPayPal()` (port) | `fetch` to PayPal |
| LLM output | `generateStructured()` | Parse LLM text by hand |
| Auto vs approval | `autonomyGate()` | Re-implement the rule in a service or UI |
| Proposal check | `validateRecommendation()` | Skip validation "because the LLM is reliable" |
| Money | `lib/money.ts` | `parseFloat`, string math |
| Time | `clock.now()` | `new Date()` outside `lib/clock.ts` |
| Env | `env` from `lib/env.ts` | `process.env` elsewhere |
| Errors | `AppError(code, …)` | `throw new Error` in app code |
| Route | `handler({input, run})` | Hand-rolled try/catch per route |
| Idempotency | `idempotencyKey()` | Random request IDs |
| UI provenance | `<ProvenancePanel/>` | Re-render provenance fields ad hoc |

If you create a reusable function, add a row to ARCHITECTURE §4 in the same task.

## 5. Update protocol (do it right after tests pass)

| What changed | Update immediately |
|---|---|
| Any task finished | PROGRESS.md: tick the box, add a changelog line `YYYY-MM-DD HH:MM IST · TASK-ID · what · files · tests` |
| Module added, renamed, or removed | ARCHITECTURE.md §3 (tree) and §4 (catalog) |
| Route, schema, state, or contract changed | The matching ARCHITECTURE.md section (§6, §7, §9, §10, or §11) |
| Env var or script changed | README.md §10 or §11 and `.env.example` |
| PayPal fact learned or disproved | ARCHITECTURE.md §11 (verified or unverified list), SPIKE.md, and save the real JSON response (secrets removed) to `tests/fixtures/paypal/` |
| Design decision made | ARCHITECTURE.md §18 |

Never leave docs "for later". Stale docs cost every other agent time.

## 6. Testing rules

- Every function with logic has a test in the same task. No test, not done.
- **domain:** table-driven unit tests, no mocks.
- **agent:** use `MockLlm`. Cover valid output, invalid JSON, a rule violation that triggers the fallback, and that the buyer message never appears in the system prompt.
- **executors, services, routes:** Vitest + PGlite + MSW with fixtures. Assert DB state, events, and the exact PayPal request (including `PayPal-Request-Id`).
- **UI:** Testing Library for `ActionBar`, `ProvenancePanel`, `DayCloseGate`, `QueueGrid`. No snapshot tests.
- `pnpm test` is offline and deterministic. Live PayPal tests go only in `tests/sandbox/`.
- A fixed bug gets a regression test.
- Run only affected tests while working; run `pnpm check` once before you mark the task done.

## 7. Token and time discipline

- Do not summarise or re-explain the architecture. Do not re-read files you wrote this session.
- Never open `drizzle/`, `pnpm-lock.yaml`, or large JSON fixtures in full. Use `head -c 1500` or `jq 'keys'`.
- Search with `rg -n` and read only the lines you need.
- Do not paste whole files into your reply. Report a short diff summary.
- If a PayPal API shape is unknown: ARCHITECTURE §11, then the official docs. Do not guess. Record what you learned (§5).
- **Stuck more than 20 minutes?** Write it under Blockers in PROGRESS.md, use the fallback listed there, and move on.

## 8. Code conventions

- TypeScript strict, no `any`. Zod at every boundary (HTTP, DB reads of jsonb, LLM output, PayPal responses).
- Named exports (default exports only for Next.js pages and layouts).
- Files at most 200 lines, functions at most 40. Split before you exceed them.
- Errors through `AppError`. Logging through `logger`; never log secrets or full buyer messages.
- Dates are UTC ISO strings in storage; format only in the UI.
- No business logic in UI components. Derived fields come from the server.
- Money and tracking facts shown in the UI come from the API, never recomputed client-side.

## 9. Common pitfalls

- PayPal amounts are strings (`"10.00"`). Convert with `lib/money.ts`.
- Dispute evidence works only when status is `WAITING_FOR_SELLER_RESPONSE` **and** the provide-evidence link is present.
- Repeated clicks, retries, and duplicate webhooks must be harmless: check state, then idempotency key.
- The Agent Toolkit covers only `list_disputes`, `get_dispute`, `accept_dispute_claim` for disputes. Evidence needs REST.
- `accept_dispute_claim` concedes to the buyer. Treat it as high-impact.
- The buyer message is untrusted text. Never put it in a system prompt.
- A contested dispute is `waiting_on_paypal`, not resolved, until PayPal says so.
- Do not call `new Date()`; the demo uses a simulated clock.

## 10. Definition of done

A task is done only when **all** are true:

- [ ] Code written and follows §1 and §8
- [ ] Tests written and passing (`pnpm check` green)
- [ ] Docs updated per §5
- [ ] PROGRESS.md ticked with a changelog line
- [ ] Committed with the task ID
- [ ] Reply sent in 5 lines or fewer

## 11. Blocked or unsure?

1. Check ARCHITECTURE.md §4 and §11 first.
2. If still blocked, add a line under **Blockers** in PROGRESS.md: what you tried, what you need, which fallback you will use.
3. Switch to the fallback and continue. Do not silently change a locked rule.
