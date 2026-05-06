# 3. Session Grants

A session grant authorises a terminal to perform card operations for a bounded time window. It carries the session key, permitted operations, and a backend signature the terminal uses to verify its authenticity.

> Session grant structure and key derivation: [Tech Specs §12](../tech-specs/12_key-hierarchy-session-grants.md).

---

## `GET /api/session-grant`

Request a new session grant for the authenticated terminal.

**Request headers**: `Authorization: Bearer <terminal-token>`

**Response** (`200 OK`):
```json
{
  "keyVersion": 3,
  "sessionKey": "<base64-encoded 32-byte key>",
  "expiresAt": 1746700000,
  "allowedOps": ["read", "debit", "checkin", "checkout"],
  "signature": "<base64-encoded backend ECDSA/HMAC signature>"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `keyVersion` | uint8 | Identifies the key set to use for per-card key derivation |
| `sessionKey` | base64 string | 32-byte terminal session key |
| `expiresAt` | uint32 | UTC seconds; terminal must not use this grant after this time |
| `allowedOps` | string[] | Operations this terminal may perform during this session |
| `signature` | base64 string | Backend signature over the above fields; terminal must verify before use |

**Allowed operations vocabulary**:

| Value | Permitted action |
|-------|-----------------|
| `read` | Read and validate card state |
| `debit` | Decrement card balance |
| `checkin` | Transition card to `CHECKED_IN` |
| `checkout` | Transition card to `CHECKED_OUT` |
| `topup` | Increment card balance (Station only; requires online confirmation) |
| `reissue` | Initialise or re-initialise a card (Station only) |
| `block` | Set card status to blocked (Station only) |

**Error responses**:

| Code | Error | Cause |
|------|-------|-------|
| `401 Unauthorized` | `invalid_token` | Bearer token missing or invalid |
| `403 Forbidden` | `terminal_suspended` | Terminal has been administratively disabled |
| `429 Too Many Requests` | `rate_limited` | Too many grant requests; retry after `Retry-After` seconds |

## Grant storage rules

- The terminal must **not** persist the `sessionKey` to disk or durable storage.
- The grant is held in process memory only for the duration of the session window.
- If the terminal restarts, it must request a new grant before resuming card operations.
