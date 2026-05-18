# 6. Reconciliation

Terminals upload offline events when connectivity returns. The backend validates them and records reconciled events.

> See [Tech Specs §9](../tech-specs/9_risk-financial-limits.md) and [Tech Specs §14](../tech-specs/14_transaction-log-format.md).

## `POST /api/reconcile`

**Request**:

```json
{
  "terminalId": 42,
  "events": [
    {
      "cardId": "<6-byte hex>",
      "counter": 17,
      "type": "debit",
      "amount": 15000,
      "balanceAfter": 485000,
      "timestamp": 1746690000,
      "hash": "<6-byte hash>"
    }
  ]
}
```

**Response**:

```json
{
  "accepted": 3,
  "rejected": 1,
  "flags": [
    {
      "cardId": "<hex>",
      "counter": 18,
      "reason": "daily_limit_exceeded"
    }
  ]
}
```

Common errors:

- `400 malformed_payload`
- `401 invalid_token`
- `409 duplicate_counter`

## Notes

- Batches should be ordered by `counter` ascending.
- Duplicate or tampered events are rejected.
- Policy limit breaches may be accepted and flagged rather than rejected.
