<p align="center">
  <img src="docs/assets/spike-logo.svg" alt="Spike logo" width="120" />
</p>

# Spike — Supervised PayPal Autonomy

> A daily, deadline-driven operations desk where an AI agent resolves PayPal refund requests and customer disputes for online sellers under strict, deterministic supervised autonomy. It acts on its own inside limits the seller sets, and asks before anything material.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-spike--paypal.vercel.app-black?logo=vercel)](https://spike-paypal.vercel.app/)
[![YouTube Demo](https://img.shields.io/badge/YouTube-Demo%20Video-red?logo=youtube)](https://youtu.be/KnEOE6LBpqY)
[![GitHub Repository](https://img.shields.io/badge/GitHub-0xgokkull%2Fspike-blue?logo=github)](https://github.com/0xgokkull/spike)
[![Tests](https://img.shields.io/badge/Vitest-51%20passing-brightgreen)](https://github.com/0xgokkull/spike)
[![Next.js 15](https://img.shields.io/badge/Next.js-15%20App%20Router-black?logo=next.js)](https://nextjs.org/)
[![PayPal Sandbox](https://img.shields.io/badge/PayPal-Sandbox%20Verified-003087?logo=paypal)](https://developer.paypal.com)
[![Groq Fast Inference](https://img.shields.io/badge/Groq-Qwen%2027B%20JSON-orange)](https://groq.com)
[![AG Grid](https://img.shields.io/badge/AG%20Grid-v33%20Enterprise%20Ready-00A389)](https://www.ag-grid.com)

- **Live Deployment:** [https://spike-paypal.vercel.app/](https://spike-paypal.vercel.app/)
- **Demo Video (YouTube):** [https://youtu.be/KnEOE6LBpqY](https://youtu.be/KnEOE6LBpqY)
- **GitHub Repository:** [https://github.com/0xgokkull/spike.git](https://github.com/0xgokkull/spike.git)
- **Status:** Feature complete for the **PayPal AI Hackathon 2026**. All 19 test suites and 51 unit, integration, and end-to-end tests passing.
- **Environment:** **Sandbox only.** Pinned to `api-m.sandbox.paypal.com`. No live-money switch exists.

---

## Navigation & Documentation

| Document | Description |
|---|---|
| [README.md](README.md) | Product overview, live demo walkthrough, quick start, and hackathon rubric mapping (this file) |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Full architectural blueprint, module tree, reuse index, domain state machine, and PayPal contracts |
| [PROGRESS.md](PROGRESS.md) | Complete chronological audit log, task board, and changelog |
| [SPIKE.md](SPIKE.md) | Empirical results and live network verification of the PayPal Disputes & Payments API spike |
| [DEVPOST_SUBMISSION.md](DEVPOST_SUBMISSION.md) | Pre-written submission package for Devpost (story, tracks, and AI disclosures) |

---

## 1. The Problem

Online merchants face a relentless stream of "give the money back" requests split across two chaotic channels:

1. **PayPal Disputes:** Governed by strict 10-to-20 day deadlines, complex HATEOAS availability states, and rigorous evidence packaging requirements. Miss a deadline or submit incomplete evidence, and funds are automatically forfeited.
2. **Refund Requests:** Arriving as unstructured buyer messages requiring subjective judgment against store return policies.

Handling these manually causes delayed responses, lost disputes, and revenue leaks. Fully autonomous AI agents, on the other hand, risk hallucinating facts, issuing unauthorized refunds, or making legally binding concessions.

**Spike** bridges this gap using a principled engineering architecture: **"LLM proposes, code disposes."**

---

## 2. What Spike Does

The seller opens one screen, the **Resolution Center**. It presents every open case, prioritized by strict response deadlines and capital at risk.

```
Incoming PayPal Dispute / Customer Refund Request
                    │
                    ▼
       ┌─────────────────────────┐
       │   Groq AI Policy Triage │ ◄── Store Refund Policy (P-1 to P-5)
       │     (Qwen 27B JSON)     │ ◄── DB Ground-Truth Order & Tracking Facts
       └────────────┬────────────┘
                    │ Proposes 1 Action + Policy Citation
                    ▼
       ┌─────────────────────────┐
       │   Deterministic Gate    │ ◄── Hard Rules & Auto-Refund Cap ($25)
       │    (Code, Not LLM)      │
       └──────┬───────────┬──────┘
              │           │
     Eligible │           │ High Stakes / Cap Exceeded
       Refund │           │ (Contest, Concede, Reply)
              ▼           ▼
        [ MODE: AUTO ] [ MODE: APPROVAL ]
              │           │
              │     Seller Approves / Edits / Snoozes
              │           │
              └─────┬─────┘
                    ▼
       ┌─────────────────────────┐
       │   PayPal Sandbox REST   │ ◄── Idempotent Execution (`PayPal-Request-Id`)
       │      & Agent Toolkit    │
       └────────────┬────────────┘
                    ▼
       ┌─────────────────────────┐
       │  Audit Event Timeline   │ ──► Locked Ledger & Day Close Gate
       └─────────────────────────┘
```

1. **Intake & Ingestion:** Pulls disputes automatically from PayPal Sandbox (`v1/customer/disputes`) or registers incoming customer refund requests.
2. **High-Speed AI Triage:** The LLM reads the buyer's message, references the merchant's plain-English policy (`P-1` to `P-5`), correlates ground-truth tracking events, and proposes **one** action with policy citations and structured rationale in $< 1.5$ seconds.
3. **Deterministic Autonomy Gate:** Pure code—never the LLM—decides whether the proposal may execute automatically or requires merchant approval.
4. **Human-in-the-Loop Supervision:** The seller reviews the case in a slide-over drawer featuring a **Provenance Panel** (separating verified facts from AI prose) and an executive **Audit Event Timeline**. The seller can **Approve**, **Edit Rationale**, or **Snooze (+24h)**. There is no dismiss button.
5. **Idempotent Execution:** Actions dispatch to PayPal Sandbox with strict idempotency keys (`PayPal-Request-Id`).
6. **Day Close Financial Gate:** The business day cannot close until all actionable disputes are resolved and all autonomous actions are formally acknowledged in the ledger.

---

## 3. Supported Actions & Execution Modes

| Action | PayPal Sandbox Mechanism | AI's Role | Autonomy Rule |
|---|---|---|---|
| **Refund** | Payments REST / Agent Toolkit `create_refund` | Recommends refund amount and cites policy clause | **Auto** if $\le \$25$ cap, eligible reason, and tracking shows not delivered. Otherwise **Approval Required**. |
| **Contest Dispute** | Disputes REST `provide-evidence` + `pdf-lib` | Synthesizes formal evidence narrative and delivery proof | **Always Approval Required** (requires 100% complete evidence checklist). |
| **Accept Claim** | Agent Toolkit `accept_dispute_claim` | Recommends conceding when cost to contest exceeds capital at risk | **Always Approval Required** (legally concedes dispute to buyer). |
| **Send Reply** | Local dispute communication | Drafts polite, professional update message to buyer | **Always Approval Required** (communicates on behalf of merchant). |

---

## 4. UI Architecture (PayPal Resolution Center Inspired)

The user interface follows the visual hierarchy and discipline of the official **PayPal Business Resolution Center** and **Stripe Dashboard**:

- **Centered Layout (`max-w-7xl`):** Content is framed with balanced horizontal padding on both sides, ensuring clean readability across wide displays.
- **4-KPI Overview Metric Cards:** Surfaces `Total Cases`, `Action Required`, `Amount at Risk`, and `Resolved` with prominent `3xl` tabular numbers and PayPal blue, amber, indigo, and emerald accents.
- **Unified Dispute Queue Card:** AG Grid Community table locked to a stable `460px` height to eliminate layout jumping. Column widths are budgeted to `1065px` with zero horizontal scroll and zero text clipping.
- **Instant In-Memory Tab Switching:** Toggling between `All Cases`, `Actionable`, `Waiting on PayPal`, `Snoozed`, and `Resolved` is instant (0ms latency) while keeping top KPI metric cards and tab badges accurate.
- **Executive Audit Event Timeline:** Tucks raw JSON payloads into an expandable `<details>` summary while presenting human-readable transition pills (`[Awaiting Approval] → [Resolved]`), error guidance callouts, and structured settlement IDs (Refund ID, Dispute ID).
- **Interactive Storefront Purchase Modal (`+ Make Purchase (Demo)`):** Allows judges and operators to simulate live customer purchases and dispute filings on the fly, triggering immediate Groq AI triage.

---

## 5. Live Demo Flow (3 Minutes or Less)

| Time | Action | What is Demonstrated |
|---|---|---|
| **0:00 – 0:30** | **Resolution Center Dashboard** | Point out the **Spike** brand, **Live Sandbox** indicator, and the 4 financial KPI cards. Explain the core principle: *"LLM proposes, deterministic code disposes."* |
| **0:30 – 1:15** | **Click `+ Make Purchase (Demo)`** | Select **Vintage Mechanical Watch ($120.00)** or **Wireless Earbuds ($20.00)**. Show sub-1.5s live Groq AI triage against store refund policy clauses (`P-1` to `P-5`). |
| **1:15 – 2:00** | **Supervisor Review in Case Drawer** | Open the case drawer. Highlight the **Provenance Panel** (separating DB facts from AI text) and the formatted **Audit Event Timeline**. Click **`Approve Recommendation`** to execute live via PayPal. |
| **2:00 – 2:40** | **Snooze & Business Clock Advance** | Snooze a case to tomorrow's date. Click **`+1 Day`** on the header bar to advance the business date and show the snoozed case waking back into the actionable queue. |
| **2:40 – 3:00** | **Day Close Reconciliation Gate** | Navigate to **`Day Close`** via Top Nav. Demonstrate that day close remains locked until all pending approvals are cleared. Acknowledge automated actions and close the business day. |

*Full end-to-end integration running with live PayPal Sandbox order creation, buyer authorization, and automated policy triage.*

---

## 6. Tech Stack

| Area | Technology | Purpose |
|---|---|---|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript Strict | Server & Client Components, responsive modern dashboard |
| **Styling** | Tailwind CSS v4 | Clean fintech aesthetics, custom PayPal dual-tone gradients |
| **Data Grid** | AG Grid Community v33 | Enterprise-grade dispute queue and reconciliation ledger |
| **Database** | Supabase PostgreSQL + Drizzle ORM | 9 relational tables with migrations and foreign key integrity |
| **AI Inference** | Groq SDK (`qwen/qwen3.8-27b`) | Sub-1.5s structured JSON triage and policy enforcement |
| **PayPal SDK** | `@paypal/agent-toolkit` + Disputes REST API | Live sandbox refunds, dispute queries, and claim concessions |
| **Evidence PDF** | `pdf-lib` | Deterministic synthesis of official delivery receipts |
| **Testing** | Vitest, MSW, PGlite | 51 unit, integration, and E2E tests running offline & in-memory |

---

## 7. Quick Start Guide

### Prerequisites
- Node.js 20+
- pnpm 9+
- A Supabase or local PostgreSQL database URL
- *(Optional for live mode)* PayPal Developer Sandbox credentials and Groq API key

### 1. Clone & Install
```bash
git clone https://github.com/0xgokkull/spike.git
cd spike
pnpm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Set the required environment variables:
```ini
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
PAYPAL_MODE="sandbox"              # or "fake" for offline mock mode
PAYPAL_CLIENT_ID="your_client_id"
PAYPAL_CLIENT_SECRET="your_client_secret"
LLM_PROVIDER="groq"                # or "mock" for offline deterministic tests
GROQ_API_KEY="your_groq_api_key"
LLM_MODEL="qwen/qwen3.8-27b"
APP_BASE_URL="http://localhost:3000"
DEMO_MODE="true"
```

### 3. Run Migrations & Seed Store Policy
```bash
pnpm db:migrate
pnpm seed
```

### 4. Start the Application
```bash
pnpm dev
```
Open **`http://localhost:3000`** in your browser.

---

## 8. Verification & Test Suite

Spike enforces rigorous test-driven verification across all layers:
- **Unit Tests:** Tables-driven domain tests for autonomy gates, Zod schemas, hash generation, and financial cents conversions.
- **Integration Tests:** PGlite in-memory Postgres repositories and MSW mocked PayPal REST endpoints.
- **E2E Demo Flow Test:** Validates the entire 3-minute lifecycle (intake $\rightarrow$ auto-refund $\rightarrow$ contest approval with PDF evidence $\rightarrow$ snooze $\rightarrow$ clock advance $\rightarrow$ Day Close lock).

Run the full test suite and typecheck:
```bash
pnpm check
```
*(All 19 test files and 51 tests must pass green with zero errors before any commit.)*

---

## 9. Hackathon Track & Rubric Alignment

| Criterion | Where Spike Demonstrates It |
|---|---|
| **Technological Implementation** | Live PayPal Sandbox capture refunds, dual toolkit + direct REST architecture, idempotent executors (`PayPal-Request-Id`), and 51 passing tests. |
| **Design & User Experience** | Official PayPal Resolution Center layout, centered `max-w-7xl` container, executive KPI cards, rock-solid AG Grid table, and human-readable audit timelines. |
| **Potential Impact** | Eliminates manual dispute handling for small e-commerce merchants, preventing revenue loss while keeping humans in the loop for high-value claims. |
| **Innovation** | Supervised Autonomy: The LLM proposes actions with policy citations, but deterministic code controls the execution gate. |
| **Presentation** | Seamless 3-minute demo loop supported by the built-in `+ Make Purchase (Demo)` storefront flow. |

---

## 10. AI Tools & Services Disclosure

| Component | Tool / Model | Role in Spike |
|---|---|---|
| **Runtime LLM** | Groq (`qwen/qwen3.8-27b`) | Sub-1.5s structured JSON triage, policy-bound proposals, evidence narrative, and buyer message drafting. |
| **PayPal Integration** | `@paypal/agent-toolkit`, PayPal Disputes & Payments REST APIs | Live sandbox capture refunds, dispute evidence submissions, and idempotency tracking. |
| **Development Assistance** | Antigravity AI pair programmer | Scaffolding, architecture adherence, test generation, and documentation under [ARCHITECTURE.md](ARCHITECTURE.md) design invariants. |

---

## License

This project is licensed under the **MIT License**.
