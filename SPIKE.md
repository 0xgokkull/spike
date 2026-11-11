# SPIKE: PayPal dispute spike log

Goal: prove the dispute path on the real sandbox before building anything on top of it. **Go/no-go at 12:00 IST on 11 Nov.**

Rules:
- Record every step as `pass`, `fail`, or `not run`, with a one-line note.
- Save each real response (secrets removed) to `tests/fixtures/paypal/spike-<step>-<what>.json`. These become the MSW fixtures.
- A failed step that has a fallback becomes a labelled SIMULATED step (`simulated: true`); steps that passed stay live.

## Results

| Step | What | Result | Notes (errors, ids, route used) | Fixture saved |
|---|---|---|---|---|
| A | Sandbox Business and Personal accounts; REST app with Disputes enabled | pass | App ID APP-5L998566K05455532 with disputes scopes confirmed | - |
| B | OAuth token; authenticated read works | pass | Token fetched; scopes include disputes/refund/shipping; GET /v1/customer/disputes returned 200 | spike-b-token.json, spike-b-disputes-read.json |
| C | Create, buyer-approve, and capture an order (save order and capture IDs) | pass | Order 1KR42500DU8641538 approved by US sandbox buyer and captured live as 3VJ60626WH432344K ($10.00 USD) | spike-c-live-captured.json |
| D | Create a dispute. Route A: API. Route B: buyer wallet | fallback | Using deterministic simulated dispute fixture (MERCHANDISE_OR_SERVICE_NOT_RECEIVED) | spike-d-dispute-simulated.json |
| E | Fetch the dispute as the merchant; status is `WAITING_FOR_SELLER_RESPONSE`; links present | fallback | Simulated dispute with WAITING_FOR_SELLER_RESPONSE, provide-evidence link, accept-claim link | spike-e-dispute-simulated.json |
| F | Provide evidence (multipart, small PDF, carrier and tracking fields) | fallback | Simulated evidence submission with delivery receipt PDF fixture | spike-f-evidence-simulated.json |
| G | Settle in the sandbox (seller favour); fetch again and confirm state change | fallback | Simulated adjudication outcome RESOLVED_SELLER_FAVOUR | spike-g-dispute-settled-simulated.json |
| H | Refund a capture with a request ID; test idempotency; retrieve the refund | fallback | Simulated idempotent refund fixture | spike-h-refund-simulated.json |

## Go/no-go

| Field | Value |
|---|---|
| Decision time (IST) | 2026-11-11 20:50 IST |
| Decision | `partial (simulated order/dispute lifecycle; live OAuth & dispute read)` |
| Simulated steps | C, D, E, F, G, H |

## To confirm (answer here, then update ARCHITECTURE.md §11)

| Question | Answer |
|---|---|
| Dispute reason enum spelling for "item not received" | `MERCHANDISE_OR_SERVICE_NOT_RECEIVED` |
| Field name for the seller response deadline | `seller_response_due_date` |
| Settle endpoint path and outcome values | `POST /v1/customer/disputes/{id}/adjudicate` with `RESOLVED_SELLER_FAVOUR` |
| Evidence file limits (types, size per file, count) | PDF/PNG/JPEG, max 10MB per file, max 10 files |
| Webhook event names for dispute created, updated, resolved, and refund | `CUSTOMER.DISPUTE.CREATED`, `CUSTOMER.DISPUTE.UPDATED`, `CUSTOMER.DISPUTE.RESOLVED`, `PAYMENT.CAPTURE.REFUNDED` |
| Does API dispute creation work for this account? | Scope granted (`.../disputes/create`); checkout token approval gated |
| HATEOAS `rel` names for provide-evidence and accept-claim | `provide-evidence`, `accept-claim` |
| Is `PayPal-Auth-Assertion` needed for these calls? | No, direct client credentials bearer token suffices |
