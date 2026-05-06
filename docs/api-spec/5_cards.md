# 5. Cards

Card management operations are available to Station-role terminals only. All endpoints in this section require a token with `"role": "station"` and an active session grant with the relevant `allowedOps` entry.

---

## `POST /api/cards`

Register a new card with the backend. Called by the Station app after writing the initialisation payload to a blank card.

**Request headers**: `Authorization: Bearer <station-token>`

**Request body**:
```json
{
  "cardId": "<6-byte hex>",
  "userId": 1042,
  "name": "Siti Rahayu",
  "createdAt": 1746600000,
  "keyVersion": 3
}
```

| Field | Type | Description |
|-------|------|-------------|
| `cardId` | hex string | 6-byte unique card identifier written to the identity block |
| `userId` | uint32 | Backend user account ID to associate with this card |
| `name` | string | Cardholder display name (max 32 bytes UTF-8) |
| `createdAt` | uint32 | UTC seconds of issuance timestamp written to the card |
| `keyVersion` | uint8 | Key version used during card initialisation |

**Response** (`201 Created`):
```json
{
  "cardId": "<6-byte hex>",
  "userId": 1042,
  "status": "ACTIVE",
  "balance": 0,
  "createdAt": 1746600000
}
```

**Error responses**:

| Code | Error | Cause |
|------|-------|-------|
| `403 Forbidden` | `insufficient_role` | Caller is not a station |
| `409 Conflict` | `card_already_registered` | `cardId` already exists in the backend |
| `422 Unprocessable Entity` | `invalid_user` | `userId` does not correspond to an active account |

---

## `GET /api/cards/:cardId`

Fetch the backend record for a card. Used by Scout (read-only balance/status view) and Station (pre-operation check).

**Request headers**: `Authorization: Bearer <token>` (any role)

**Response** (`200 OK`):
```json
{
  "cardId": "<6-byte hex>",
  "userId": 1042,
  "status": "ACTIVE",
  "balance": 350000,
  "counter": 17,
  "createdAt": 1746600000,
  "lastActivity": 1746690000
}
```

**Error responses**:

| Code | Error | Cause |
|------|-------|-------|
| `404 Not Found` | `card_not_found` | No registered card with this `cardId` |

---

## `POST /api/cards/:cardId/topup`

Add balance to a card. Requires the Station to be online; no offline top-up is permitted.

**Request headers**: `Authorization: Bearer <station-token>`

**Request body**:
```json
{
  "amount": 100000,
  "operatorId": 7,
  "timestamp": 1746700000
}
```

**Response** (`200 OK`):
```json
{
  "cardId": "<6-byte hex>",
  "balanceBefore": 350000,
  "balanceAfter": 450000,
  "amount": 100000,
  "timestamp": 1746700000
}
```

**Error responses**:

| Code | Error | Cause |
|------|-------|-------|
| `403 Forbidden` | `insufficient_role` | Caller is not a station |
| `404 Not Found` | `card_not_found` | Card not registered |
| `422 Unprocessable Entity` | `balance_ceiling_exceeded` | `balanceAfter` would exceed `maxBalance` |
| `422 Unprocessable Entity` | `card_blocked` | Card is in any blocked status; top-up is not allowed |

---

## `POST /api/cards/:cardId/block`

Administratively block a card. Sets status to `BLOCKED_ADMIN` on the backend record. The Station app must then write the updated status to the physical card.

**Request headers**: `Authorization: Bearer <station-token>`

**Request body**:
```json
{
  "reason": "lost",
  "operatorId": 7,
  "timestamp": 1746701000
}
```

`reason` must be one of: `lost`, `stolen`, `fraud`, `decommission`.

**Response** (`200 OK`):
```json
{
  "cardId": "<6-byte hex>",
  "status": "BLOCKED_ADMIN",
  "blockedAt": 1746701000,
  "reason": "lost"
}
```

**Error responses**:

| Code | Error | Cause |
|------|-------|-------|
| `403 Forbidden` | `insufficient_role` | Caller is not a station |
| `404 Not Found` | `card_not_found` | Card not registered |
| `409 Conflict` | `already_blocked` | Card is already in a blocked status |

---

## `POST /api/cards/:cardId/reissue`

Authorise a blocked card for re-issuance. The backend marks the card as clearable and issues a station session grant with the `reissue` operation. The Station app must physically re-write the card payload.

> Re-issuance for `BLOCKED_TAMPER` and `BLOCKED_FRAUD` requires explicit backend authorization. See [Tech Specs §15](../tech-specs/15_status-codes-block-rules.md).

**Request headers**: `Authorization: Bearer <station-token>`

**Request body**:
```json
{
  "operatorId": 7,
  "authCode": "<one-time backend-issued authorisation code>",
  "timestamp": 1746702000
}
```

**Response** (`200 OK`):
```json
{
  "cardId": "<6-byte hex>",
  "reissueGranted": true,
  "newKeyVersion": 4,
  "timestamp": 1746702000
}
```

**Error responses**:

| Code | Error | Cause |
|------|-------|-------|
| `403 Forbidden` | `insufficient_role` | Caller is not a station |
| `403 Forbidden` | `reissue_not_authorised` | Backend authorisation code missing or expired |
| `404 Not Found` | `card_not_found` | Card not registered |
| `422 Unprocessable Entity` | `card_not_blocked` | Card is `ACTIVE`; reissue is not applicable |
