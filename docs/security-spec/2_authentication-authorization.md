# 2. Authentication & Authorization

## Two-layer authentication

Every privileged request must satisfy both layers. Failure in either layer results in `401 Unauthorized`.

| Layer | What is proved | Mechanism |
|-------|----------------|-----------|
| Device identity | This browser installation is an enrolled terminal for the koperasi tenant | Commissioning secret (one-time) → rotated to device key pair after enrollment |
| Operator identity | This human has the correct credentials and second factor for the claimed tenant role | Password + TOTP or WebAuthn |

The backend issues a short-lived **access token** and a longer-lived **refresh token** only after both layers pass. Both tokens are bound to `tenantId`, `accountId`, `deviceId`, and the permitted role scope.

---

## MFA requirements

| Role | MFA requirement |
|------|----------------|
| `tenant_admin` | Required (TOTP or WebAuthn); may not disable |
| `station_operator` | Required |
| `gate_operator` | Required |
| `terminal_operator` | Required |
| `reconciler` | Required |
| `scout` (member self-service) | Optional; configurable per tenant |

MFA is enforced server-side at token issuance. A token is never issued if MFA is required and not satisfied.

### TOTP constraints

- Algorithm: HMAC-SHA1 (RFC 6238)
- Time step: 30 seconds
- Drift allowance: ±1 step (60 seconds total)
- Seed: stored server-side as AES-256-GCM encrypted blob; never transmitted in plaintext

### WebAuthn constraints

- Authenticator attachment: platform or cross-platform, tenant-configurable
- Attestation: none required for basic flow; direct attestation for high-assurance tenants
- Resident keys: preferred to support usernameless flow on managed devices

---

## Tenant-scoped RBAC

Every authorization check enforces three conditions simultaneously:

1. `tenantId` in the token matches the `tenantId` of the resource being accessed.
2. `role` in the token grants the required permission for the requested operation.
3. The `accountId` membership is `active` in `account_memberships`.

No API endpoint assumes tenant context from the request body. Tenant scope is read from the verified token only.

### Permission matrix

| Permission | tenant_admin | station_operator | gate_operator | terminal_operator | reconciler | scout |
|------------|:---:|:---:|:---:|:---:|:---:|:---:|
| Issue / re-key card | − | ✓ | − | − | − | − |
| Top-up balance | − | ✓ | − | − | − | − |
| Block card | ✓ | ✓ | ∓ | ∓ | − | − |
| Request session grant | − | ✓ | ✓ | ✓ | − | − |
| Submit reconciliation | − | ∓ | ∓ | ✓ | − | − |
| Manage accounts / devices | ✓ | − | − | − | − | − |
| View audit log | ✓ | − | − | − | ✓ | − |
| Read card state | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

(✓ = always, ∓ = conditional, − = denied)

---

## Token lifecycle

### Access token

- **TTL**: 15 minutes (recommended); configurable per tenant, minimum 5 minutes
- **Storage**: process memory only; never written to disk, `localStorage`, or a cookie
- **Revocation**: no server-side revocation needed given short TTL; refresh is blocked on account/device suspension

### Refresh token

- **TTL**: 30 days (recommended); configurable per tenant
- **Storage client-side**: AES-256-GCM encrypted blob in IndexedDB; encryption key derived from device-bound material (WebCrypto `CryptoKey` non-extractable)
- **Storage server-side**: `refresh_token_hash` (BLAKE2b or SHA-256 of the raw token); never the raw token
- **Revocation**: server-side revocation on `auth_sessions.revoked_at`; device or account suspension cascades to all open sessions for that device/account

### Rotation on use

- Every successful refresh issues a new refresh token and invalidates the previous one (token rotation).
- If an already-revoked refresh token is presented, the session is treated as compromised: all sessions for that device are revoked immediately.

---

## Device enrollment security

1. **Commissioning secret**: generated server-side; one-time-use; delivered out-of-band (e.g., QR code over TLS). The server stores only the hash of the secret.
2. **Device key pair**: after first successful use of the commissioning secret, the client generates a non-extractable ECDSA P-256 key pair in WebCrypto; the public key is registered with the backend. Subsequent authentications use a signed challenge, not the commissioning secret.
3. **Device suspension**: a suspended device receives `403 device_suspended` on every call. All open sessions for that device are revoked.

---

## Session grant binding

A session grant must be bound to all of the following or be rejected at the backend:

| Field | Binding |
|-------|---------|
| `tenantId` | Must match the active tenant in the issuing access token |
| `accountId` | Must match the issuing operator |
| `deviceId` | Must match the enrolled device presenting the access token |
| `allowedOps` | Restricted to the role's permission set |
| `expiresAt` | Set by backend policy (1–24 hours) |
| `signature` | ECDSA or HMAC-SHA256 signed by the backend with the tenant key material |

A terminal must validate the grant signature before using it. An invalid or expired grant must result in a full refresh cycle.

---

## Logout and session termination

- Logout must revoke the server-side `auth_sessions` row for the active session.
- The client must wipe `operatorSession`, `tenantContext`, and all encrypted caches from IndexedDB for the active tenant on logout.
- A tenant switch (selecting a different koperasi) must force a new login and must invalidate all session-grant-derived key material from the previous tenant.

---

## Cross-references

- API Spec §2: [Authentication](../api-spec/2_auth.md)
- Data Spec §3: [`auth_sessions` table](../data-spec/3_backend-db-schema.md)
- Data Spec §5: [`operatorSession` IndexedDB store](../data-spec/5_multitenancy-auth-local-first.md)
- Tech Specs §12: [Key Hierarchy & Session Grants](../tech-specs/12_key-hierarchy-session-grants.md)
