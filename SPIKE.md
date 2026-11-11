# SPIKE: PayPal dispute spike log

Goal: prove the dispute path on the real sandbox before building anything on top of it. **Go/no-go at 12:00 IST on 11 Nov.**

Rules:
- Record every step as `pass`, `fail`, or `not run`, with a one-line note.
- Save each real response (secrets removed) to `tests/fixtures/paypal/spike-<step>-<what>.json`. These become the MSW fixtures.
- A failed step that has a fallback becomes a labelled SIMULATED step (`simulated: true`); steps that passed stay live.

## Results

| Step | What | Result | Notes (errors, ids, route used) | Fixture saved |
|---|---|---|---|---|
| A | Sandbox Business and Personal accounts; REST app with Disputes enabled | not run | | |
| B | OAuth token; authenticated read works | not run | | |
| C | Create, buyer-approve, and capture an order (save order and capture IDs) | not run | | |
| D | Create a dispute. Route A: API. Route B: buyer wallet | not run | Route used: | |
| E | Fetch the dispute as the merchant; status is `WAITING_FOR_SELLER_RESPONSE`; links present | not run | | |
| F | Provide evidence (multipart, small PDF, carrier and tracking fields) | not run | | |
| G | Settle in the sandbox (seller favour); fetch again and confirm state change | not run | Settle path used: | |
| H | Refund a second capture with a request ID; repeat the call; retrieve the refund | not run | Repeat returned same refund? | |

## Go/no-go

| Field | Value |
|---|---|
| Decision time (IST) | |
| Decision | `go` / `partial (list simulated steps)` / `no-go` |
| Simulated steps | |

## To confirm (answer here, then update ARCHITECTURE.md §11)

| Question | Answer |
|---|---|
| Dispute reason enum spelling for "item not received" | |
| Field name for the seller response deadline | |
| Settle endpoint path and outcome values | |
| Evidence file limits (types, size per file, count) | |
| Webhook event names for dispute created, updated, resolved, and refund | |
| Does API dispute creation work for this account? | |
| HATEOAS `rel` names for provide-evidence and accept-claim | |
| Is `PayPal-Auth-Assertion` needed for these calls? | |
