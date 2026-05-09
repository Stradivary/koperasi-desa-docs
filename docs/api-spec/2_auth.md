# 2. Authentication

## Tenant session issuance

Authentication is split into two layers:

- **Device identity**: the browser installation or managed device proves that it is an enrolled terminal for a koperasi tenant.
- **Operator identity**: the human user proves who they are and which tenant role they are activating.

The backend returns a short-lived access token plus a refresh token. Every token is bound to `tenantId`, `accountId`, `deviceId`, and role scope.

### `POST /api/auth/token`

Exchange device credentials and operator credentials for an authenticated tenant session.

> Device enrollment may happen during commissioning, but token issuance happens whenever an operator signs in or refreshes a session.

**Request body**:
```json
{
  "tenantSlug": "koperasi-kegelapan",
  "deviceId": "<unique hardware or installation identifier>",
  "deviceSecret": "<device commissioning secret or signed device assertion>",
  "username": "<operator username or email>",
  "password": "<operator password>",
  "otpCode": "123456",
  "role": "terminal"
}
```

`role` must be one of: `terminal`, `gate`, `station`, `scout`.

**Response** (`200 OK`):
```json
{
  "accessToken": "<opaque bearer token>",
  "refreshToken": "<opaque refresh token>",
  "expiresAt": 1778236800,
  "tenantId": "<uuid>",
  "deviceId": "<echo>",
  "account": {
    "accountId": "<uuid>",
    "displayName": "<operator name>",
    "roles": ["terminal_operator"]
  },
  "role": "terminal"
}
```

**Error responses**:

| Code | Error | Cause |
|------|-------|-------|
| `401 Unauthorized` | `invalid_credentials` | Operator credential mismatch |
| `401 Unauthorized` | `invalid_device_credentials` | `deviceId` / `deviceSecret` mismatch |
| `401 Unauthorized` | `mfa_required` | Second factor is required or invalid |
| `403 Forbidden` | `tenant_suspended` | Tenant has been suspended administratively |
| `403 Forbidden` | `device_suspended` | Device has been administratively disabled |
| `403 Forbidden` | `account_suspended` | Operator account is disabled |
| `422 Unprocessable Entity` | `invalid_role` | `role` value not recognised |
| `422 Unprocessable Entity` | `invalid_tenant` | `tenantSlug` not recognised or not assigned to the account |

## Token rotation

Access tokens should be short-lived (recommended: 15 minutes). Refresh tokens may live longer (recommended: 30 days) but must be revocable per device and per tenant.

Offline terminals may continue to use cached session grants only until the current access token and cached operator session expire. They must re-authenticate before any new online sync or privileged write flow.

## Scout tokens

Scout (member-facing) tokens are issued with `"role": "scout"`. Scout tokens permit only read operations (`GET /api/cards/:id`). They cannot request session grants, submit reconciliation batches, or perform any card write operations.

## Security notes

- The commissioning `deviceSecret` is a one-time-use value provisioned out-of-band (e.g. via a QR code printed during device setup). It should be rotated into a device-bound key pair after enrollment.
- Refresh tokens must be stored in device-local secure storage or encrypted IndexedDB, not in browser `localStorage` or cookies accessible to web content.
- The backend logs all token issuance events for audit purposes.
- Passwords, OTP seeds, and raw device secrets are never returned by the API and are never stored in plaintext.
