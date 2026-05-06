# 3. Backend DB Schema

The backend uses a relational database (PostgreSQL) to store the authoritative server-side record of cards, users, terminals, audit events, and reconciliation history.

> This schema is the **server-side projection** of card state. It is not the source of truth for offline balance — the card is. The backend schema becomes authoritative only after reconciliation.

---

## Entity overview

| Table | Purpose |
|-------|---------|
| `users` | Cooperative members; one user may have one card at a time |
| `terminals` | Registered devices with a role and credentials |
| `cards` | Backend record of each issued card |
| `audit_log` | Immutable log of every reconciled card event |
| `reconciliation_batches` | Metadata about each submitted reconciliation batch |
| `key_versions` | Record of active and retired key sets |

---

## `users`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `user_id` | `uint32` / `INTEGER` | PK, NOT NULL | Backend-assigned member ID; matches card `userId` field |
| `name` | `VARCHAR(100)` | NOT NULL | Full member name |
| `status` | `VARCHAR(20)` | NOT NULL, default `'active'` | Account status: `active`, `suspended`, `closed` |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | Account creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | Last modification timestamp |

**Notes:**
- A suspended or closed user account prevents new card issuance but does not automatically block existing cards.
- `user_id` values are never reused.

---

## `terminals`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `terminal_id` | `SMALLINT` | PK, NOT NULL | Backend-assigned terminal ID (uint16); matches card `session.terminalId` |
| `device_id` | `VARCHAR(128)` | UNIQUE, NOT NULL | Hardware or installation identifier used for auth |
| `role` | `VARCHAR(20)` | NOT NULL | One of: `terminal`, `gate`, `station`, `scout` |
| `name` | `VARCHAR(100)` | | Human-readable label for the device |
| `status` | `VARCHAR(20)` | NOT NULL, default `'active'` | `active`, `suspended` |
| `last_token_issued_at` | `TIMESTAMPTZ` | | Timestamp of most recent token issuance |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | Registration timestamp |

**Notes:**
- `device_id` + `role` are verified at token issuance. The commissioning `secret` is one-time-use and not stored after first use (hashed for verification only).
- A suspended terminal receives `403 device_suspended` on any API call.

---

## `cards`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `card_id` | `BYTEA(6)` | PK, NOT NULL | 6-byte card identifier set at issuance |
| `user_id` | `INTEGER` | FK → `users.user_id`, NOT NULL | Owning user |
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
- `card_id` is never reused. Re-issued cards receive the same `card_id` with updated fields.

**Constraints:**
```sql
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
| `card_id` | `BYTEA(6)` | FK → `cards.card_id`, NOT NULL | Card involved in this event |
| `terminal_id` | `SMALLINT` | FK → `terminals.terminal_id` | Terminal that created this event |
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
CONSTRAINT audit_log_counter_unique UNIQUE (card_id, counter),
CONSTRAINT audit_log_amount_non_negative CHECK (amount >= 0),
CONSTRAINT audit_log_balance_non_negative CHECK (balance_after >= 0)
```

---

## `reconciliation_batches`

One row per `POST /api/reconcile` call.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `batch_id` | `BIGSERIAL` | PK, NOT NULL | Auto-incrementing batch ID |
| `terminal_id` | `SMALLINT` | FK → `terminals.terminal_id`, NOT NULL | Submitting terminal |
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
CREATE INDEX idx_cards_user_id ON cards (user_id);

-- Fast audit log queries per card, ordered by counter
CREATE INDEX idx_audit_log_card_counter ON audit_log (card_id, counter);

-- Fast batch queries per terminal
CREATE INDEX idx_audit_log_batch ON audit_log (batch_id);

-- Review queue
CREATE INDEX idx_audit_log_review ON audit_log (review_flag) WHERE review_flag = true;
```

---

## Cross-references

- Card field definitions: [Data Spec §2 Card Binary Schema](2_card-binary-schema.md)
- Status codes and transition rules: [Tech Specs §15 Status Codes & Block Rules](../tech-specs/15_status-codes-block-rules.md)
- Reconciliation API payload: [API Spec §6 Reconciliation](../api-spec/6_reconciliation.md)
- Financial limits enforced at reconciliation: [Tech Specs §9 Risk & Financial Limits](../tech-specs/9_risk-financial-limits.md)
