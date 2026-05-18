# 9. Risk & Financial Limits

## Financial bounds

| Limit                      | Value             | Notes                                                               |
| -------------------------- | ----------------- | ------------------------------------------------------------------- |
| Maximum storable balance   | **Rp 16,000,000** | `uint32` ceiling                                                    |
| Recommended balance cap    | **Rp 5,000,000**  | Enforced by backend policy; reduces exposure from card loss         |
| Single transaction maximum | **Rp 1,000,000**  | Enforced per write; applies to both online and offline transactions |
| Daily cumulative limit     | **Rp 2,000,000**  | Enforced by backend on reconciliation; terminal tracks locally      |
| Weekly cumulative limit    | **Rp 5,000,000**  | Backend policy; triggers elevated review on breach                  |

## Enforcement mechanism

- **At write time (terminal)**: before constructing the new payload, the terminal checks the proposed `amount` against the single-transaction limit. If the limit is exceeded, the transaction is rejected without touching the card.
- **At reconciliation (backend)**: the backend validates each event against the daily and weekly cumulative totals per card. Events that breach limits are flagged for review; the card is not automatically blocked, but the breach is logged.
- **Policy refresh**: the terminal fetches the current limit set via `GET /api/policy` at session grant time. Cached policy values are used when offline.
- **Offline exposure**: because limits are only fully enforced at reconciliation, a lost or stolen card used across multiple offline terminals can accumulate transactions up to the session grant scope. The recommended balance cap limits the worst-case exposure.

## Risk management

- Require backend validation for any top-up or balance credit operation; debits may proceed offline within the session grant scope.
- Keep offline exposure bounded by session duration and the per-transaction limit.
- Treat tamper or rollback events as high-priority incidents: freeze the card, log the event, and notify an operator.
- Review cards with repeated near-limit transactions across reconciliation windows as potential fraud signals.
