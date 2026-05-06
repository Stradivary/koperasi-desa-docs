# 2. Authentication

## Terminal token issuance

Terminals and gate devices receive a long-lived identity token during commissioning. This token identifies the device to the backend and gates access to all other endpoints.

### `POST /api/auth/token`

Exchange device credentials for a terminal identity token.

> This endpoint is called once during commissioning, not on every session. Tokens are long-lived and should be stored securely by the device.

**Request body**:
```json
{
  "deviceId": "<unique hardware or installation identifier>",
  "secret": "<device commissioning secret>",
  "role": "terminal"
}
```

`role` must be one of: `terminal`, `gate`, `station`, `scout`.

**Response** (`200 OK`):
```json
{
  "token": "<opaque bearer token>",
  "expiresAt": 1778236800,
  "deviceId": "<echo>",
  "role": "terminal"
}
```

**Error responses**:

| Code | Error | Cause |
|------|-------|-------|
| `401 Unauthorized` | `invalid_credentials` | `deviceId` / `secret` mismatch |
| `403 Forbidden` | `device_suspended` | Device has been administratively disabled |
| `422 Unprocessable Entity` | `invalid_role` | `role` value not recognised |

## Token rotation

Tokens have a long TTL (default: 1 year). Devices should re-authenticate when they receive a `401` on any endpoint with a previously valid token. The backend may revoke a token at any time; revoked tokens receive `401 Unauthorized` on any call.

## Scout tokens

Scout (member-facing) tokens are issued with `"role": "scout"`. Scout tokens permit only read operations (`GET /api/cards/:id`). They cannot request session grants, submit reconciliation batches, or perform any card write operations.

## Security notes

- The commissioning `secret` is a one-time-use value provisioned out-of-band (e.g. via a QR code printed during device setup).
- Tokens must be stored in device-local secure storage, not in browser `localStorage` or cookies accessible to web content.
- The backend logs all token issuance events for audit purposes.
