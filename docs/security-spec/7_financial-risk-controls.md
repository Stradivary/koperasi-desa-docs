# 7. Financial Risk Controls

## Limit enforcement chain

Financial controls are applied at three independent checkpoints. All three must be consistent.

| Checkpoint     | Enforced by        | When                         | Limits applied                                       |
| -------------- | ------------------ | ---------------------------- | ---------------------------------------------------- |
| Write time     | Terminal app       | Before card write            | Single-transaction maximum                           |
| Reconciliation | Backend            | On batch receipt             | Daily cumulative, weekly cumulative, balance ceiling |
| Policy cache   | Terminal (offline) | Cached at session grant time | All limits; refreshed when online                    |

The terminal must refuse a transaction immediately if the proposed amount exceeds the single-transaction limit, without touching the card. The backend is the authoritative enforcer for daily and weekly limits because it has the full reconciliation history.

---

## Limit values

| Limit                         | Value         | Enforcement point                                |
| ----------------------------- | ------------- | ------------------------------------------------ |
| Maximum storable balance      | Rp 16,000,000 | Card schema `uint32` ceiling                     |
| Recommended balance cap       | Rp 5,000,000  | Backend policy; configurable per tenant          |
| Single transaction maximum    | Rp 1,000,000  | Terminal write-time check                        |
| Daily cumulative debit limit  | Rp 2,000,000  | Backend reconciliation                           |
| Weekly cumulative debit limit | Rp 5,000,000  | Backend reconciliation; triggers elevated review |

Tenant admins may configure tighter limits per tenant but may not raise them above the platform defaults without platform-operator approval.

---

## Anomaly detection signals

The backend flags events for review when any of the following conditions are met:

| Signal                             | Condition                                                                      | Action                                        |
| ---------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------- |
| Daily limit breach                 | Card cumulative debit ≥ Rp 2,000,000 in a calendar day                         | Flag `review_flag = true` in `audit_log`      |
| Weekly limit breach                | Card cumulative debit ≥ Rp 5,000,000 in a calendar week                        | Flag + operator notification                  |
| Rapid debits                       | > 10 debit events for the same card in < 60 minutes                            | Flag as suspicious; set `suspect_flag = true` |
| Counter gap                        | Submitted event counter > last reconciled counter + N (configurable threshold) | Flag for investigation                        |
| Offline batch latency              | Batch submitted > 48 hours after session grant expiry                          | Flag all events in batch                      |
| Balance ceiling approach           | Post-transaction balance > 90% of balance cap                                  | Informational flag                            |
| Repeated blocked card presentation | Same blocked card presented > 3 times in a session                             | Terminal report event                         |

---

## Risk incident response

| Severity     | Trigger                                                           | Response                                                                                          |
| ------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **Critical** | Master key or tenant key compromise                               | Emergency rotation; all terminals must re-authenticate; all cards requiring re-keying are flagged |
| **High**     | Reconciliation fraud (crafted events without card write evidence) | Freeze card; escalate to `BLOCKED_FRAUD`; notify tenant admin                                     |
| **High**     | Tamper event rate > 0.1% of daily taps                            | Alert; investigate source terminal or card batch                                                  |
| **Medium**   | Reconciliation failure rate > 1%                                  | Alert; investigate batch content for malformed events                                             |
| **Medium**   | Session grant re-use from different device                        | Revoke grant; log event; alert                                                                    |
| **Low**      | Repeated limit breaches from same card                            | Operator review; no automatic block                                                               |

---

## Monitoring requirements

The backend must expose metrics or alerts for:

- Tamper event count per tenant per hour
- Reconciliation failure rate per terminal
- Cards with `review_flag = true` pending operator action
- Auth failures per account per hour (credential stuffing indicator)
- Refresh token rotation failures (stolen token reuse indicator)
- Tenant-level daily spend against the cumulative limit

Alerts must be delivered to the tenant admin within the session grant TTL window so they can act before the offline exposure window closes.

---

## Cross-references

- Tech Specs §9: [Risk & Financial Limits](../tech-specs/9_risk-financial-limits.md)
- ADR §6: [Balance Ceiling](../adr/6_balance-ceiling.md)
- Data Spec §3: [`audit_log` table](../data-spec/3_backend-db-schema.md)
- Security Spec §4: [Card Tamper Detection](4_card-tamper-detection.md)
