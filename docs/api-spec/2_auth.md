# 2. Authentication

Authentication combines device identity and operator credentials.

### `POST /api/auth/token`

Exchange device and operator credentials for an authenticated tenant session.

**Request body**:

```json
{
  "tenantSlug": "koperasi-kegelapan",
  "deviceId": "<device identifier>",
  "deviceSecret": "<commissioning secret or signed assertion>",
  "username": "<operator username>",
  "password": "<operator password>",
  "otpCode": "123456",
  "role": "terminal"
}
```

**Response**:

```json
{
  "accessToken": "<token>",
  "refreshToken": "<token>",
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

**Common errors**:

| Code  | Error                        | Cause                              |
| ----- | ---------------------------- | ---------------------------------- |
| `401` | `invalid_credentials`        | Operator credentials are invalid   |
| `401` | `invalid_device_credentials` | Device identity is invalid         |
| `403` | `tenant_suspended`           | Tenant is disabled                 |
| `403` | `device_suspended`           | Device is disabled                 |
| `403` | `account_suspended`          | Account is disabled                |
| `422` | `invalid_role`               | Unsupported role                   |
| `422` | `invalid_tenant`             | Tenant not found or not accessible |

## Token lifecycle

- Access tokens should be short-lived.
- Refresh tokens should be revocable.
- Offline terminals can use cached session state until it expires, but must re-authenticate before online sync or privileged write operations.

## Scout tokens

Scout tokens allow read-only card lookup and cannot request session grants, reconciliation, or card write operations.

## Security notes

- Device secrets should be provisioned out-of-band and rotated into device-bound identity when available.
- Refresh credentials must be stored securely, not in plaintext browser storage.
- The API never returns passwords, OTP seeds, or raw enrollment secrets.
