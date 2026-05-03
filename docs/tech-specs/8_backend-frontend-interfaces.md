# 8. Backend & Frontend Interfaces

This section defines the application contract between the browser UI, terminal flows, NFC card payloads, and the backend service. It is written as a practical developer reference for building the app with TanStack Start on the frontend and Nitro on the backend.

## Purpose

- Make frontend, terminal, and backend responsibilities explicit.
- Keep the card format and API behavior stable and easy to implement.
- Provide a shared reference for developers and documentation readers.

## Frontend architecture

- Build the app using TanStack Start conventions: routing, query caching, and state management.
- Use Web NFC to interact with the card and Web Crypto to validate encryption and authentication.
- Show clear workflows for reading card details, creating transactions, and reconciling offline events.
- Store temporary offline events in browser-managed storage (IndexedDB or localStorage) when backend access is unavailable.
- Support two UI modes:
  - **Member view**: read-only balance, history, and card status.
  - **Terminal mode**: write-enabled flow for transactions, check-ins, and reconciliation.

## Backend architecture

- Run as a Nitro-compatible service with API routes for session grants, policy data, reconciliation, and audit logging.
- Issue and rotate session grants and key versions.
- Authenticate terminals, manage risk rules, and validate high-risk operations.
- Reconcile offline card events and persist operational logs.
- Expose a stable API that frontend and terminal code can depend on.

## Interface contracts

### Session grants

- Issued by the backend with `keyVersion`, expiry, permitted operations, and backend signature.
- Kept temporarily by terminals; never stored permanently on the card.
- Validated by the frontend before allowing any state-changing write.

### Card payloads

- Include current balance, status, replay counter, session pointer, and authentication trailer.
- Are read by the frontend and validated locally before the app makes decisions.
- Are rejected as suspicious if cryptographic validation fails.

## API endpoints

### `GET /api/session-grant`

Request a new session grant for an authenticated terminal.

**Request headers**: `Authorization: Bearer <terminal-token>`

**Response** (`200 OK`):
```json
{
  "keyVersion": 3,
  "sessionKey": "<base64-encoded 32-byte key>",
  "expiresAt": 1746700000,
  "allowedOps": ["read", "debit", "checkin", "checkout"],
  "signature": "<base64-encoded backend signature>"
}
```

**Error responses**: `401 Unauthorized` (invalid terminal token), `403 Forbidden` (terminal suspended).

---

### `GET /api/policy`

Fetch current risk limits, status rules, and permitted operations for this terminal.

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

---

### `POST /api/reconcile`

Upload a batch of offline terminal events after connectivity returns.

**Request body**:
```json
{
  "terminalId": 42,
  "events": [
    {
      "cardId": "<hex>",
      "counter": 17,
      "type": "debit",
      "amount": 15000,
      "balanceAfter": 485000,
      "timestamp": 1746690000,
      "hash": "<hex>"
    }
  ]
}
```

**Response** (`200 OK`):
```json
{ "accepted": 1, "rejected": 0 }
```

**Error responses**: `400 Bad Request` (malformed payload), `409 Conflict` (duplicate counter).

---

### `POST /api/terminal-report`

Notify the backend of a tamper event, suspicious card state, or terminal error.

**Request body**:
```json
{
  "terminalId": 42,
  "cardId": "<hex>",
  "eventType": "tamper",
  "details": "HMAC mismatch on read",
  "timestamp": 1746692000
}
```

**Response** (`204 No Content`).

## Terminal behavior

- Confirm card state and status before every transaction.
- Enforce status, session, and risk rules in the terminal workflow.
- Use the A/B buffer process for safe card writes.
- Queue reconciliation events and upload them when backend connectivity is restored.

## UX guidance

- Display simple, user-facing messages such as `Card blocked`, `Session expired`, `Pending reconciliation`, and `Invalid card state`.
- Hide low-level cryptographic details from users.
- Keep terminal, station, and gate flows consistent across screens.

## Developer guidance

- Keep schema and interface definitions aligned between frontend and backend.
- Prefer shared type generation or schema references (e.g., Zod schemas or OpenAPI types) to avoid frontend/backend drift.
- Document all card field or API schema changes in the spec before deployment.
- Treat the frontend as the canonical place for card validation logic, with backend policies used for trusted decisions and session management.
