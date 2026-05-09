# 5. Multitenancy, Auth & Local-first Storage

This section defines the data contracts needed to support multiple koperasi tenants, account management, stronger authentication, and local-first terminal behavior.

## Tenant isolation rules

- Every tenant-owned backend row must include `tenantId`.
- Unique identifiers that users type or see, such as `userId`, `terminalId`, and operator usernames, may be reused only if the governing table defines whether uniqueness is global or tenant-scoped.
- Cache keys, object storage paths, background jobs, and exported reports must be partitioned by `tenantId`.
- Cross-tenant reads and writes are forbidden even for shared infrastructure operators unless they act through an audited break-glass process.

## Auth data boundaries

The authentication model separates four categories of data:

| Category | Stored where | Notes |
|----------|--------------|-------|
| Account credentials | Backend auth tables | Password hash and MFA references only; never replicated client-side |
| Device credentials | Backend device tables + secure client storage | Prefer asymmetric device keys over long-lived shared secrets |
| Access tokens | Process memory only | Short-lived; discarded on reload or expiry |
| Refresh sessions | Server hash + encrypted client copy | Server stores only hashes; client copy must live in encrypted IndexedDB or equivalent |

## IndexedDB stores

The terminal and station clients use IndexedDB as the durable local-first store. Store names are normative.

### `tenantContext`

| Field | Type | Description |
|-------|------|-------------|
| `tenantId` | `string` | Active koperasi tenant |
| `tenantSlug` | `string` | Human-readable tenant selector |
| `roleSet` | `string[]` | Active roles for current account |
| `lastHydratedAt` | `number` | Unix epoch seconds of latest successful sync |

Primary key: `tenantId`

### `operatorSession`

| Field | Type | Description |
|-------|------|-------------|
| `sessionId` | `string` | Refresh-session identifier |
| `tenantId` | `string` | Tenant scope |
| `accountId` | `string` | Logged-in user |
| `deviceId` | `string` | Enrolled device |
| `refreshTokenCiphertext` | `ArrayBuffer` | Encrypted refresh token blob |
| `expiresAt` | `number` | Expiry time |
| `revoked` | `boolean` | Local revocation marker |

Primary key: `sessionId`

### `cardSnapshot`

| Field | Type | Description |
|-------|------|-------------|
| `tenantId` | `string` | Tenant scope |
| `cardId` | `string` | Hex-encoded card identifier |
| `userId` | `number` | Owning wallet user |
| `status` | `string` | Last known card status |
| `balance` | `number` | Last known reconciled or read balance |
| `counter` | `number` | Latest observed card counter |
| `payloadVersion` | `number` | Card schema version |
| `updatedAt` | `number` | Last local read/write time |

Primary key: `[tenantId, cardId]`

### `policyCache`

| Field | Type | Description |
|-------|------|-------------|
| `tenantId` | `string` | Tenant scope |
| `policyVersion` | `number` | Monotonic version supplied by backend |
| `policyJson` | `object` | Cached risk and status policy document |
| `expiresAt` | `number` | Cache expiry |

Primary key: `tenantId`

### `reconciliationOutbox`

| Field | Type | Description |
|-------|------|-------------|
| `outboxId` | `string` | Deterministic idempotency key |
| `tenantId` | `string` | Tenant scope |
| `deviceId` | `string` | Source device |
| `accountId` | `string` | Source operator |
| `cardId` | `string` | Card involved |
| `counter` | `number` | Event counter |
| `txType` | `string` | Event type |
| `payloadJson` | `object` | Serialized reconciliation event |
| `createdAt` | `number` | Local creation time |
| `syncState` | `string` | `pending`, `sending`, `acked`, `dead_letter` |
| `lastError` | `string` | Most recent sync error |

Primary key: `outboxId`

Secondary index: `[tenantId, syncState, createdAt]`

### `syncCheckpoint`

| Field | Type | Description |
|-------|------|-------------|
| `tenantId` | `string` | Tenant scope |
| `streamName` | `string` | Logical stream such as `cards`, `policies`, or `devices` |
| `cursor` | `string` | Backend-issued continuation token |
| `updatedAt` | `number` | Last successful pull |

Primary key: `[tenantId, streamName]`

## Local-first write rules

- Any offline-created event must be written to `reconciliationOutbox` before the UI reports success.
- `syncState = sending` is advisory only; retries must be safe because `outboxId` is idempotent.
- On successful reconciliation, the client updates `cardSnapshot` and advances the relevant `syncCheckpoint`.
- Tenant logout must wipe `tenantContext`, `operatorSession`, and all tenant-scoped caches for that tenant unless policy explicitly allows warm caches for read-only data.

## Migration guidance

- Introduce `tenant_id` columns as nullable in backfill migrations, populate them for existing single-tenant rows, then enforce `NOT NULL` and composite keys.
- Migrate long-lived device tokens into `devices` plus `auth_sessions`; revoke legacy tokens after the new refresh flow is stable.
- Version the IndexedDB schema separately from the card schema so local cache upgrades do not force card reissuance.