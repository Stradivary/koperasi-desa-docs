# 4. Policy

The policy endpoint returns current risk limits and blocked status codes for the authenticated terminal.

> See [Tech Specs §9](../tech-specs/9_risk-financial-limits.md) for enforcement rules.

## `GET /api/policy`

**Response**:
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

Common fields:
- `maxBalance`
- `singleTxLimit`
- `dailyLimit`
- `weeklyLimit`
- `blockedStatuses`
- `clockDriftAllowanceSec`

Common error:
- `401 invalid_token`

## Caching

- Fetch policy on grant renewal.
- Use cached policy until the grant expires.
- If policy is unavailable, go online before financial transactions.
