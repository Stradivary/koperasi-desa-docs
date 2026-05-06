# 6. Reconciliation

Terminals accumulate offline events during connectivity gaps. When connectivity is restored, the terminal submits a reconciliation batch. The backend validates each event against policy limits and persists them to the audit log.

> Financial limit enforcement rules: [Tech Specs §9](../tech-specs/9_risk-financial-limits.md).
> Transaction log format: [Tech Specs §14](../tech-specs/14_transaction-log-format.md).

---

## `POST /api/reconcile`

Upload a batch of offline terminal events.

**Request headers**: `Authorization: Bearer <terminal-token>`

**Request body**:
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
      "hash": "<6-byte truncated chain hash, hex>"
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `terminalId` | uint16 | Identifies the submitting terminal |
| `events` | array | Ordered list of card events (earliest first) |
| `events[].cardId` | hex string | 6-byte card identifier |
| `events[].counter` | uint64 | Monotonic write counter at the time of this event |
| `events[].type` | string | `debit`, `credit`, `checkin`, `checkout`, `admin` |
| `events[].amount` | uint32 | Transaction amount in IDR (0 for non-financial events) |
| `events[].balanceAfter` | uint32 | Card balance after this event |
| `events[].timestamp` | uint32 | UTC seconds when the event occurred |
| `events[].hash` | hex string | 6-byte truncated chain hash from the card log entry |

**Response** (`200 OK`):
```json
{
  "accepted": 3,
  "rejected": 1,
  "flags": [
    {
      "counter": 18,
      "cardId": "<hex>",
      "reason": "daily_limit_exceeded"
    }
  ]
}
```

| Field | Description |
|-------|-------------|
| `accepted` | Number of events accepted and logged |
| `rejected` | Number of events that failed validation (duplicate, tamper, malformed) |
| `flags` | Events accepted but flagged for review (limit breach, suspicious pattern) |

Non-flagged events within policy are accepted silently. Flagged events are logged and surfaced to the reconciliation operator.

**Error responses**:

| Code | Error | Cause |
|------|-------|-------|
| `400 Bad Request` | `malformed_payload` | Request body missing required fields or wrong types |
| `401 Unauthorized` | `invalid_token` | Bearer token missing or invalid |
| `409 Conflict` | `duplicate_counter` | An event with the same `cardId` + `counter` was already reconciled |

## Rejection vs flagging

| Condition | Outcome |
|-----------|---------|
| Duplicate `cardId` + `counter` | Rejected (not logged again) |
| Hash mismatch against known chain | Rejected; tamper event auto-reported |
| Balance inconsistency | Rejected |
| Daily limit exceeded | Accepted + flagged |
| Weekly limit exceeded | Accepted + flagged |
| `amount` > `singleTxLimit` | Rejected (should have been blocked at terminal) |

## Ordering

Events within a batch must be ordered by `counter` ascending. If events for multiple cards are mixed in one batch, the backend processes them in the order received.
