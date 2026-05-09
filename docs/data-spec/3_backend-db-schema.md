# 3. Backend DB Schema

The backend uses a relational database (PostgreSQL) to store the authoritative server-side record of tenants, member accounts, operator accounts, enrolled devices, cards, audit events, and reconciliation history.

> This schema is the **server-side projection** of card state. It is not the source of truth for offline balance — the card is. The backend schema becomes authoritative only after reconciliation.

> Tenant isolation is mandatory. Every business table below carries `tenant_id`, and every unique key that identifies a tenant-owned record must be unique inside a tenant scope unless explicitly marked global.

---

## Entity overview

| Table | Purpose |
|-------|---------|
| `tenants` | One koperasi tenant per cooperative organisation |
| `accounts` | Authenticated human principals (admins and operators) |
| `account_memberships` | Tenant-scoped roles assigned to accounts |
| `users` | Cooperative members / wallet holders inside a tenant |
| `devices` | Registered browser installations or managed terminals |
| `auth_sessions` | Refresh-token sessions and revocation state |
| `cards` | Backend record of each issued card |
| `audit_log` | Immutable log of every reconciled card event |
| `reconciliation_batches` | Metadata about each submitted reconciliation batch |
| `key_versions` | Record of active and retired key sets |

---

## `tenants`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `tenant_id` | `UUID` | PK, NOT NULL | Stable koperasi identifier |
| `slug` | `VARCHAR(80)` | UNIQUE, NOT NULL | Human-readable tenant slug used during login |
| `name` | `VARCHAR(160)` | NOT NULL | Legal or public koperasi name |
| `status` | `VARCHAR(20)` | NOT NULL, default `'active'` | `active`, `suspended`, `closed` |
| `timezone` | `VARCHAR(64)` | NOT NULL | Default reporting timezone |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | Tenant creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | Last modification timestamp |

**Notes:**
- `slug` values are never reused after tenant creation.
- `closed` tenants are immutable except for export and audit actions.

---

## `accounts`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `account_id` | `UUID` | PK, NOT NULL | Stable human account identifier |
| `username` | `VARCHAR(120)` | UNIQUE, NOT NULL | Login name or email |
| `display_name` | `VARCHAR(120)` | NOT NULL | Human-readable account name |
| `password_hash` | `TEXT` | NOT NULL | Argon2id or equivalent password hash |
| `mfa_mode` | `VARCHAR(20)` | NOT NULL, default `'optional'` | `required`, `optional`, `disabled` |
| `mfa_secret_encrypted` | `BYTEA` | | Encrypted OTP seed or WebAuthn credential reference |
| `status` | `VARCHAR(20)` | NOT NULL, default `'active'` | `active`, `suspended`, `locked` |
| `last_login_at` | `TIMESTAMPTZ` | | Most recent successful login |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | Account creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | Last modification timestamp |

**Notes:**
- Password reset tokens and OTP challenge state should live in a dedicated auth subsystem or short-TTL cache, not in business tables.
- `password_hash` must never be replicated to client storage.

---

## `account_memberships`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `membership_id` | `UUID` | PK, NOT NULL | Stable membership row identifier |
| `tenant_id` | `UUID` | FK → `tenants.tenant_id`, NOT NULL | Owning koperasi |
| `account_id` | `UUID` | FK → `accounts.account_id`, NOT NULL | Authenticated person |
| `role` | `VARCHAR(32)` | NOT NULL | `tenant_admin`, `station_operator`, `gate_operator`, `terminal_operator`, `reconciler`, `scout` |
| `status` | `VARCHAR(20)` | NOT NULL, default `'active'` | `active`, `suspended`, `revoked` |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | Membership creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | Last modification timestamp |

**Constraints:**
```sql
CONSTRAINT account_memberships_unique UNIQUE (tenant_id, account_id, role)
```

---

## `users`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `tenant_id` | `UUID` | FK → `tenants.tenant_id`, NOT NULL | Owning koperasi |
| `user_id` | `uint32` / `INTEGER` | NOT NULL | Backend-assigned member ID; matches card `userId` field |
| `name` | `VARCHAR(100)` | NOT NULL | Full member name |
| `account_id` | `UUID` | FK → `accounts.account_id` | Optional self-service login account for the member |
| `status` | `VARCHAR(20)` | NOT NULL, default `'active'` | Account status: `active`, `suspended`, `closed` |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | Account creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | Last modification timestamp |

**Notes:**
- A suspended or closed user account prevents new card issuance but does not automatically block existing cards.
- `user_id` values are never reused inside the same tenant.

**Constraints:**
```sql
PRIMARY KEY (tenant_id, user_id)
```

---

## `devices`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `tenant_id` | `UUID` | FK → `tenants.tenant_id`, NOT NULL | Owning koperasi |
| `device_id` | `UUID` | PK, NOT NULL | Stable browser-installation or hardware identifier |
| `terminal_id` | `SMALLINT` | NOT NULL | Backend-assigned terminal ID (uint16); matches card `session.terminalId` |
| `device_label` | `VARCHAR(100)` | | Human-readable device label |
| `public_key` | `TEXT` | | Device public key for signed assertions |
| `secret_hash` | `TEXT` | | Hashed commissioning secret when asymmetric enrollment is not available |
| `role` | `VARCHAR(20)` | NOT NULL | One of: `terminal`, `gate`, `station`, `scout` |
| `status` | `VARCHAR(20)` | NOT NULL, default `'active'` | `active`, `suspended` |
| `last_token_issued_at` | `TIMESTAMPTZ` | | Timestamp of most recent access-token issuance |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | Registration timestamp |

**Notes:**
- `device_id` + `role` are verified at token issuance inside the tenant scope.
- The commissioning secret is one-time-use and should be replaced by a device key pair after enrollment.
- A suspended terminal receives `403 device_suspended` on any API call.

**Constraints:**
```sql
CONSTRAINT devices_tenant_terminal_unique UNIQUE (tenant_id, terminal_id),
CONSTRAINT devices_tenant_role_unique UNIQUE (tenant_id, device_id, role)
```

---

## `auth_sessions`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `session_id` | `UUID` | PK, NOT NULL | Refresh-session identifier |
| `tenant_id` | `UUID` | FK → `tenants.tenant_id`, NOT NULL | Active koperasi scope |
| `account_id` | `UUID` | FK → `accounts.account_id`, NOT NULL | Logged-in operator or member |
| `device_id` | `UUID` | FK → `devices.device_id`, NOT NULL | Device that holds the refresh token |
| `refresh_token_hash` | `TEXT` | NOT NULL | Server-side hash of refresh token |
| `access_scope` | `JSONB` | NOT NULL | Serialized roles and allowed operations |
| `expires_at` | `TIMESTAMPTZ` | NOT NULL | Refresh-token expiry |
| `revoked_at` | `TIMESTAMPTZ` | | Revocation timestamp |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | Session issuance timestamp |
| `last_used_at` | `TIMESTAMPTZ` | | Most recent refresh event |

**Notes:**
- Access tokens are not stored directly; only refresh-token sessions and hashes are persisted.
- Revoking either the account membership or device invalidates all matching sessions.

---

## `cards`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `tenant_id` | `UUID` | FK → `tenants.tenant_id`, NOT NULL | Owning koperasi |
| `card_id` | `BYTEA(6)` | NOT NULL | 6-byte card identifier set at issuance |
| `user_id` | `INTEGER` | NOT NULL | Owning user |
| `status` | `VARCHAR(20)` | NOT NULL, default `'ACTIVE'` | Mirrors card `status` field; see [status codes](2_card-binary-schema.md#status-codes) |
| `balance` | `INTEGER` | NOT NULL, default `0`, ≥ 0 | Last known balance after most recent reconciliation (IDR) |
| `counter` | `BIGINT` | NOT NULL, default `0` | Most recent reconciled `counter` value; used to detect replay |
| `key_version` | `SMALLINT` | NOT NULL | Key version written to the card at issuance or last re-issuance |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | Issuance timestamp |
| `last_activity_at` | `TIMESTAMPTZ` | | Timestamp of most recently reconciled event |
| `expires_at` | `TIMESTAMPTZ` | NOT NULL | Card expiry, mirrors trailer `expiresAt` |
| `notes` | `TEXT` | | Operator notes (e.g., block reason narrative) |

**Notes:**
- `balance` and `counter` reflect the **last reconciled state**, not necessarily the current card state. A card may have offline transactions not yet submitted.
- Status changes (`BLOCKED_*`, `ACTIVE`) applied by reconciliation or station operations are written here.
- `card_id` is never reused inside a tenant. Re-issued cards receive the same `card_id` with updated fields.

**Constraints:**
```sql
PRIMARY KEY (tenant_id, card_id),
FOREIGN KEY (tenant_id, user_id) REFERENCES users (tenant_id, user_id),
CONSTRAINT cards_balance_non_negative CHECK (balance >= 0),
CONSTRAINT cards_balance_ceiling CHECK (balance <= 16000000),
CONSTRAINT cards_status_valid CHECK (status IN ('ACTIVE','BLOCKED_TAMPER','BLOCKED_FRAUD','BLOCKED_EXPIRED','BLOCKED_ADMIN'))
```

---

## `audit_log`

Append-only. No rows are updated or deleted after insertion.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `log_id` | `BIGSERIAL` | PK, NOT NULL | Auto-incrementing server-side log entry ID |
| `tenant_id` | `UUID` | FK → `tenants.tenant_id`, NOT NULL | Owning koperasi |
| `card_id` | `BYTEA(6)` | NOT NULL | Card involved in this event |
| `terminal_id` | `SMALLINT` | NOT NULL | Terminal that created this event |
| `account_id` | `UUID` | FK → `accounts.account_id` | Logged-in operator responsible for the action |
| `counter` | `BIGINT` | NOT NULL | Card `counter` value at time of event; uniqueness enforced per `card_id` |
| `tx_type` | `VARCHAR(20)` | NOT NULL | Event type: `debit`, `credit`, `checkin`, `checkout`, `admin` |
| `amount` | `INTEGER` | NOT NULL, ≥ 0 | Transaction amount (IDR); `0` for non-financial events |
| `balance_after` | `INTEGER` | NOT NULL, ≥ 0 | Card balance after this event |
| `chain_hash` | `BYTEA(6)` | NOT NULL | 6-byte truncated SHA-256 chain hash from the card log entry |
| `event_at` | `TIMESTAMPTZ` | NOT NULL | Timestamp of the event (from card `deltaTime` + `session.startTime`) |
| `reconciled_at` | `TIMESTAMPTZ` | NOT NULL | Server timestamp when this entry was accepted |
| `offline_flag` | `BOOLEAN` | NOT NULL, default `false` | `true` if the terminal was offline when this event was created |
| `suspect_flag` | `BOOLEAN` | NOT NULL, default `false` | `true` if terminal or backend flagged as suspicious |
| `review_flag` | `BOOLEAN` | NOT NULL, default `false` | `true` if backend flagged for limit breach or policy review |
| `batch_id` | `BIGINT` | FK → `reconciliation_batches.batch_id` | Reconciliation batch that delivered this entry |

**Constraints:**
```sql
FOREIGN KEY (tenant_id, card_id) REFERENCES cards (tenant_id, card_id),
CONSTRAINT audit_log_counter_unique UNIQUE (tenant_id, card_id, counter),
CONSTRAINT audit_log_amount_non_negative CHECK (amount >= 0),
CONSTRAINT audit_log_balance_non_negative CHECK (balance_after >= 0)
```

---

## `reconciliation_batches`

One row per `POST /api/reconcile` call.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `batch_id` | `BIGSERIAL` | PK, NOT NULL | Auto-incrementing batch ID |
| `tenant_id` | `UUID` | FK → `tenants.tenant_id`, NOT NULL | Owning koperasi |
| `terminal_id` | `SMALLINT` | NOT NULL | Submitting terminal |
| `account_id` | `UUID` | FK → `accounts.account_id` | Operator that initiated the sync |
| `submitted_at` | `TIMESTAMPTZ` | NOT NULL | Server timestamp of receipt |
| `event_count` | `INTEGER` | NOT NULL | Total events in the submitted batch |
| `accepted` | `INTEGER` | NOT NULL | Number of events accepted |
| `rejected` | `INTEGER` | NOT NULL | Number of events rejected (duplicate, tamper, malformed) |
| `flagged` | `INTEGER` | NOT NULL, default `0` | Number of events accepted but flagged for review |

---

## `key_versions`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `key_version` | `SMALLINT` | PK, NOT NULL | Key version identifier (uint8, 1–255) |
| `status` | `VARCHAR(20)` | NOT NULL | `active`, `retired`, `revoked` |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | When this key version was activated |
| `retired_at` | `TIMESTAMPTZ` | | When this key version was retired (no longer issued to new cards) |
| `revoked_at` | `TIMESTAMPTZ` | | When this key version was revoked (all cards must be re-issued) |

**Notes:**
- The raw key material is **not stored in this table**. Key material lives in a secrets manager (e.g., HashiCorp Vault, AWS Secrets Manager). This table tracks only version lifecycle.
- `retired` means no new cards are issued with this version, but existing cards remain valid.
- `revoked` means all cards with this `key_version` must be re-issued at next station visit.

---

## Indexes

```sql
-- Fast card lookup by user
CREATE INDEX idx_cards_tenant_user_id ON cards (tenant_id, user_id);

-- Fast audit log queries per card, ordered by counter
CREATE INDEX idx_audit_log_tenant_card_counter ON audit_log (tenant_id, card_id, counter);

-- Fast batch queries per terminal
CREATE INDEX idx_audit_log_batch ON audit_log (tenant_id, batch_id);

-- Review queue
CREATE INDEX idx_audit_log_review ON audit_log (tenant_id, review_flag) WHERE review_flag = true;

-- Active tenant memberships
CREATE INDEX idx_account_memberships_active ON account_memberships (tenant_id, account_id) WHERE status = 'active';

-- Revocable refresh sessions per device
CREATE INDEX idx_auth_sessions_device ON auth_sessions (tenant_id, device_id) WHERE revoked_at IS NULL;
```

---

## Cross-references

- Card field definitions: [Data Spec §2 Card Binary Schema](2_card-binary-schema.md)
- Multitenant and local-first storage rules: [Data Spec §5 Multitenancy, Auth & Local-first Storage](5_multitenancy-auth-local-first.md)
- Status codes and transition rules: [Tech Specs §15 Status Codes & Block Rules](../tech-specs/15_status-codes-block-rules.md)
- Reconciliation API payload: [API Spec §6 Reconciliation](../api-spec/6_reconciliation.md)
- Financial limits enforced at reconciliation: [Tech Specs §9 Risk & Financial Limits](../tech-specs/9_risk-financial-limits.md)
