# 3. Session Grants

A session grant authorises a terminal to perform card operations for a limited time. It includes a session key, allowed operations, and a backend signature.

> See [Tech Specs §12](../tech-specs/12_key-hierarchy-session-grants.md) for grant structure and key derivation.

## `GET /api/session-grant`

Request a session grant for the authenticated terminal.

**Response**:
```json
{
  "keyVersion": 3,
  "sessionKey": "<base64-encoded key>",
  "expiresAt": 1746700000,
  "allowedOps": ["read", "debit", "checkin", "checkout"],
  "signature": "<base64 signature>"
}
```

- `keyVersion`: key set version for per-card key derivation.
- `sessionKey`: terminal session key.
- `expiresAt`: UTC seconds after which the grant is invalid.
- `allowedOps`: permitted operations for this terminal.
- `signature`: backend signature; must be verified before use.

Common operation values:
- `read`
- `debit`
- `checkin`
- `checkout`
- `topup`
- `reissue`
- `block`

Common errors:
- `401 invalid_token`
- `403 terminal_suspended`
- `429 rate_limited`

## Grant storage rules

- Do not persist the session key to durable storage.
- Keep the grant in memory for the session duration only.
- After restart, request a new grant before resuming card writes.
