# 5. Cards

Card endpoints are for station-role operations. The station token must include the appropriate grant scope.

## `POST /api/cards`

Register a new card after writing its initial payload.

**Request**:
```json
{
  "cardId": "<6-byte hex>",
  "userId": 1042,
  "name": "Siti Rahayu",
  "createdAt": 1746600000,
  "keyVersion": 3
}
```

**Response**:
```json
{
  "cardId": "<6-byte hex>",
  "userId": 1042,
  "status": "ACTIVE",
  "balance": 0,
  "createdAt": 1746600000
}
```

Errors:
- `403 insufficient_role`
- `409 card_already_registered`
- `422 invalid_user`

## `GET /api/cards/:cardId`

Fetch the backend record for a card.

**Response**:
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

Errors:
- `404 card_not_found`

## `POST /api/cards/:cardId/topup`

Add balance to a card. Requires station role and online backend connectivity.

**Request**:
```json
{
  "amount": 100000,
  "operatorId": 7,
  "timestamp": 1746700000
}
```

**Response**:
```json
{
  "cardId": "<6-byte hex>",
  "balanceBefore": 350000,
  "balanceAfter": 450000,
  "amount": 100000,
  "timestamp": 1746700000
}
```

Errors:
- `403 insufficient_role`
- `404 card_not_found`
- `422 balance_ceiling_exceeded`
- `422 card_blocked`

## `POST /api/cards/:cardId/block`

Mark a card as administratively blocked.

**Request**:
```json
{
  "reason": "lost",
  "operatorId": 7,
  "timestamp": 1746701000
}
```

**Response**:
```json
{
  "cardId": "<6-byte hex>",
  "status": "BLOCKED_ADMIN",
  "blockedAt": 1746701000,
  "reason": "lost"
}
```

Errors:
- `403 insufficient_role`
- `404 card_not_found`
- `409 already_blocked`

## `POST /api/cards/:cardId/reissue`

Authorize a blocked card for re-issuance.

**Request**:
```json
{
  "operatorId": 7,
  "authCode": "<authorization code>",
  "timestamp": 1746702000
}
```

**Response**:
```json
{
  "cardId": "<6-byte hex>",
  "reissueGranted": true,
  "newKeyVersion": 4,
  "timestamp": 1746702000
}
```

Errors:
- `403 insufficient_role`
- `403 reissue_not_authorised`
- `404 card_not_found`
- `422 card_not_blocked`
