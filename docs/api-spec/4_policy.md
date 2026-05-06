# 4. Policy

The policy endpoint provides the current risk limits, blocked status codes, and clock drift allowance for the authenticated terminal. Terminals cache this at session grant time and use cached values when offline.

> Financial limit values and enforcement rules: [Tech Specs §9](../tech-specs/9_risk-financial-limits.md).

---

## `GET /api/policy`

Fetch current risk limits and operational constraints for this terminal.

**Request headers**: `Authorization: Bearer <terminal-token>`

**Response** (`200 OK`):
```json
{
  "maxBalance": 5000000,
  "singleTxLimit": 1000000,
  "dailyLimit": 2000000,
  "weeklyLimit": 5000000,
  "blockedStatuses": [1, 2, 3, 4],
  "clockDriftAllowanceSec": 3600
}
```

| Field | Type | Description |
|-------|------|-------------|
| `maxBalance` | uint32 | Maximum balance a card may hold (IDR) |
| `singleTxLimit` | uint32 | Maximum single transaction amount (IDR) |
| `dailyLimit` | uint32 | Maximum cumulative daily debit (IDR); enforced at reconciliation |
| `weeklyLimit` | uint32 | Maximum cumulative weekly debit (IDR); triggers review on breach |
| `blockedStatuses` | uint8[] | Status codes the terminal must treat as blocked |
| `clockDriftAllowanceSec` | uint32 | Maximum tolerated clock difference (seconds) between terminal and backend |

**Error responses**:

| Code | Error | Cause |
|------|-------|-------|
| `401 Unauthorized` | `invalid_token` | Bearer token missing or invalid |

## Caching

- The terminal should fetch a fresh policy at each session grant renewal.
- Cached policy values remain valid until the session grant expires.
- If a cached policy is unavailable (first boot, cache cleared), the terminal must go online before processing any financial transaction.
