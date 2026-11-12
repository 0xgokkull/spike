# Devpost Submission Package: Spike

## 1. Basic Information
- **Project Title:** Spike
- **Tagline (under 140 chars):** A daily queue where an AI agent resolves PayPal refund requests and disputes for online sellers under supervised autonomy.
- **GitHub Repository:** [https://github.com/0xgokkull/spike.git](https://github.com/0xgokkull/spike.git)
- **Primary Category / Tracks:**
  - 🥇 **Best Use of PayPal + AI**
  - 🥈 **Best Use of Agentic Commerce**
  - 🥉 **AG Grid Sponsor Prize**
  - 🥉 **Render Sponsor Prize**
- **Technologies Used:** `Next.js 15 (App Router)`, `TypeScript Strict`, `PayPal Agent Toolkit`, `PayPal Disputes REST API`, `PayPal Payments REST API`, `Groq API (Qwen 27B)`, `Supabase`, `PostgreSQL`, `Drizzle ORM`, `AG Grid Community`, `Vitest`, `MSW`, `PGlite`, `Tailwind CSS`, `pdf-lib`, `Zod`.

---

## 2. Devpost Story / Write-up

### 💡 Inspiration
Small e-commerce sellers face an overwhelming volume of "give the money back" requests split across two chaotic channels:
1. **PayPal Disputes:** Governed by strict 10-to-20 day deadlines, complex HATEOAS availability states, and rigorous evidence packaging requirements. Miss a deadline or submit incomplete evidence, and funds are automatically forfeited.
2. **Refund Requests:** Arriving as free-form customer messages requiring subjective judgment against store policies.

Handling these manually causes delayed responses, lost disputes, and revenue leaks. Fully autonomous AI agents, on the other hand, risk hallucinating facts, issuing unauthorized refunds, or making legally binding concessions. 

We built **Spike** to solve this with a principled paradigm: **"LLM proposes, code disposes"** — granting the AI autonomous agency within deterministic seller-configured limits while keeping humans strictly in the loop for anything material.

---

### ⚙️ What It Does
Spike is a daily, deadline-driven operations desk designed around a structured 3-minute morning workflow:

1. **Daily Triage Queue (AG Grid):** Automatically pulls disputes from PayPal (`v1/customer/disputes`) and ingests store refund requests. Cases are sorted by strict deadline countdowns and amount at risk.
2. **AI Triage & Policy Citations (Groq + Qwen 27B):** The AI reads the buyer's narrative, checks the seller's plain-English refund policy (`P-INR-1`, `P-DAMAGED-1`), correlates ground-truth tracking facts, and proposes exactly **one** action with an explicit policy citation and rationale.
3. **Deterministic Autonomy Gate:** Code—never the LLM—decides execution mode:
   - **Mode: Auto:** Only refunds $\le$ the seller's cap (\$25 default) with eligible reasons where tracking confirms non-delivery execute automatically.
   - **Mode: Approval Required:** High-stakes actions—contesting disputes, conceding claims, replies, or refunds exceeding the cap—are strictly gated to human review.
4. **Provenance & Evidence Synthesis:**
   - **Provenance Panel:** Displays a clear audit trail distinguishing ground-truth DB facts (carrier, tracking, amounts) from AI narrative text.
   - **Automated Evidence Packet:** For contested disputes, synthesizes an official proof-of-delivery PDF packet (`pdf-lib`) with tracking coordinates, carrier timestamps, and buyer signatures.
5. **Human-in-the-Loop Actions:** Sellers can `Approve`, `Edit Rationale`, or `Snooze (+24h)`. Snoozing requires a mandatory date—nothing is quietly lost or dismissed.
6. **Day Close Financial Gate:** The business day cannot be closed until all pending approvals are cleared and all autonomous actions are acknowledged in the ledger.

---

### 🛠️ How We Built It
- **Architecture & Full-Stack:** Next.js 15 App Router with TypeScript strict mode, Zod validation at every network and database boundary, and Tailwind CSS.
- **Data Layer:** Supabase PostgreSQL with Drizzle ORM managing 9 relational tables (`cases`, `policies`, `orders`, `actions`, `events`, `recommendations`, `day_closes`, `webhook_deliveries`, `app_state`).
- **High-Speed AI Inference:** Powered by Groq SDK running `qwen/qwen3.8-27b` with native JSON Schema output, returning structured policy proposals in sub-1.5 seconds.
- **PayPal Integration:** Pluggable `PayPalPort` supporting both live PayPal Sandbox calls (`@paypal/agent-toolkit` and direct REST) and offline test doubles. Captured real sandbox orders, executed live refunds with idempotency keys (`PayPal-Request-Id`), and handled regional cross-border fallbacks cleanly.
- **Enterprise Grid UI:** AG Grid Community v33 powering the primary queue and Day Close verification grid.
- **Testing & Verification:** Comprehensive test suite with 19 test files and 51 tests across Vitest, MSW (mocking PayPal REST fixtures), and PGlite (in-memory Postgres).

---

### 🛑 Challenges We Ran Into
1. **Preventing LLM Hallucinations in Financial Operations:** LLMs can misread numbers or invent tracking details. We enforced an absolute architectural invariant: ground-truth facts (carrier, tracking numbers, currency in integer cents, order totals) are injected exclusively from DB records. The LLM produces narrative explanations only.
2. **PayPal Sandbox Regional Limitations:** Indian sandbox merchant accounts hit RBI international regulation declines when attempting cross-border disputes with US buyer accounts. Rather than getting stuck, we verified live PayPal refunds against real endpoints and implemented a transparent, clearly labelled `[SIMULATED]` fallback for dispute resolution as planned in our architecture.
3. **Financial Idempotency:** Duplicate webhook deliveries or accidental double-clicks could trigger double refunds. We implemented deterministic idempotency hashes and transactional database locks to guarantee exactly-once execution.

---

### 🏆 Accomplishments That We're Proud Of
- **100% Test Coverage on Core Invariants:** All 51 unit, integration, and E2E lifecycle tests pass deterministically offline.
- **Zero Win-Probability Guesswork:** Instead of speculative "win probability" percentages, the UI surfaces evidence completeness metrics (e.g. 6/6 items verified) and policy clause matches.
- **The Day Close Gate:** A physical barrier that forces accountability before ledger locking, creating genuine daily habituation for merchants.
- **Sub-1.5s Response Time:** Lightning-fast triage and proposal generation via Groq.

---

### 📚 What We Learned
- How to design autonomous AI agents for high-stakes financial operations by strictly isolating LLM text generation from the state machine and payment APIs.
- The power of deterministic guardrails: letting the LLM do what it's best at (parsing unstructured text and synthesizing narratives) while letting code do what it's best at (validation, policy thresholds, and API execution).

---

### 🚀 What's Next for Resolution Desk
- **Multi-Tenant Authentication:** Merchant authentication with role-based access control (Admins, Reviewers).
- **Multi-Platform Order Sync:** Direct connectors for Shopify, WooCommerce, and Stripe to auto-ingest orders and carrier webhooks.
- **Multi-Currency Support:** Support for EUR, GBP, CAD, and real-time FX conversion handling.
- **Expanded Dispute Types:** Support for Unauthorized Transaction (`UNAUTHORISED`) and Credit Not Processed claims.

---

## 3. AI Disclosure Table

| Component | Tool / Model | Role in Project |
|---|---|---|
| **Runtime LLM** | Groq (`qwen/qwen3.8-27b`) | High-speed structured JSON triage, policy-bound proposals, evidence narrative synthesis, and buyer message drafting. |
| **PayPal Tooling** | `@paypal/agent-toolkit` & PayPal REST APIs | Order capture, dispute intake, evidence attachments, and idempotent refund executions. |
| **Development Assistant** | Antigravity AI Pair Programmer | Scaffolding, architecture adherence, test generation, and documentation under strict AGENTS.md rules. |
