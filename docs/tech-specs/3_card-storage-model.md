# 3. Card Storage Model

## Zones

- **Active Buffer**: Primary state storage. Identified by `activePtr` in the trailer.
- **Shadow Buffer**: Secondary state for atomic A/B writes. Becomes the new active buffer after a successful write and pointer flip.
- **Trailer / Meta**: Metadata, HMAC, and active buffer pointer. Occupies the last 64 bytes of the usable NFC memory.

Target size: **496 bytes** on NTAG215.

For NTAG215, each active or shadow buffer must fit inside roughly **216 bytes**, with the trailer occupying the remaining **64 bytes**.

## Encoding conventions

- All multi-byte integer fields are **little-endian** unless noted otherwise.
- Timestamps are **UTC seconds** stored as `uint32` (seconds since Unix epoch).
- String fields (`name`) are **UTF-8**, null-padded to fill the fixed allocation.
- `balance` and `lastBalance` are stored in the smallest currency unit (e.g., integer Rupiah, no decimals).
- Reserved fields must be zeroed on write and ignored on read.

## Payload fields

The active and shadow buffers each have a fixed size of **216 bytes** on NTAG215. The trailer/meta block is separate and occupies **64 bytes**.

### Header / Identifier Block (16 bytes)

| Field | Size | Type | Description |
|-------|------|------|-------------|
| `magic` | 4 B | bytes | Fixed 4-byte magic value for payload identification |
| `version` | 1 B | uint8 | Card layout schema version |
| `type` | 1 B | uint8 | Payload type or product class identifier |
| `cardId` | 6 B | bytes | Unique card identifier, set at issuance |
| `reserved` | 4 B | — | Reserved for future header fields; zero on write |

### Identity Block (48 bytes)

| Field | Size | Type | Description |
|-------|------|------|-------------|
| `name` | 32 B | UTF-8 | Cardholder display name, null-padded |
| `userId` | 4 B | uint32 | Internal user identifier |
| `gender` | 1 B | uint8 | Gender code (application-defined) |
| `status` | 1 B | uint8 | Card status code (see §15) |
| `createdAt` | 4 B | uint32 | Card issuance timestamp (UTC seconds) |
| `reserved` | 6 B | — | Reserved; zero on write |

### Wallet + Runtime Block (24 bytes)

| Field | Size | Type | Description |
|-------|------|------|-------------|
| `balance` | 4 B | uint32 | Current balance in smallest currency unit |
| `lastBalance` | 4 B | uint32 | Balance before the most recent transaction; used for rollback detection |
| `counter` | 8 B | uint64 | Monotonically increasing write counter; never decremented |
| `lastTimestamp` | 4 B | uint32 | Timestamp of the most recent write (UTC seconds) |
| `state` | 1 B | uint8 | Card lifecycle state (see §6) |
| `flags` | 3 B | bits | Feature and operational flags |

### Session Block (16 bytes)

| Field | Size | Type | Description |
|-------|------|------|-------------|
| `startTime` | 4 B | uint32 | Session open timestamp (UTC seconds) |
| `endTime` | 4 B | uint32 | Session close timestamp; zero if session is open |
| `terminalId` | 2 B | uint16 | Identifier of the terminal that opened the session |
| `reserved` | 6 B | — | Reserved; zero on write |

### Logs (112 bytes — 7 entries × 16 bytes each)

See §14 for full log entry definition and chain integrity rules.

| Field | Size | Type | Description |
|-------|------|------|-------------|
| `deltaTime` | 2 B | uint16 | Seconds elapsed since session start |
| `amount` | 3 B | uint24 | Transaction amount in smallest currency unit |
| `balanceAfter` | 4 B | uint32 | Balance after this transaction |
| `flags/type` | 1 B | uint8 | Transaction type and operational flags |
| `hash` | 6 B | bytes | Truncated SHA-256 chain hash |

Capacity: **7 entries** on NTAG215 (stored as a ring buffer).

### Trailer / Meta (64 bytes)

| Field | Size | Type | Description |
|-------|------|------|-------------|
| `expiresAt` | 4 B | uint32 | Card expiry timestamp (UTC seconds) |
| `keyVersion` | 1 B | uint8 | Version of the key set used to encrypt and authenticate this card |
| `rootHash` | 6 B | bytes | Truncated SHA-256 over the full log chain; anchors log sequence to current state |
| `counterBind` | 4 B | uint32 | Lower 32 bits of `counter` included in HMAC input for replay resistance |
| `reserved` | 9 B | — | Reserved; zero on write |
| `HMAC` | 8 B | bytes | Truncated HMAC-SHA256 over payload and trailer fields |
| `activePtr` | 1 B | uint8 | `0` = buffer A is active; `1` = buffer B is active |
| `padding` | rem | — | Zero-padded to fill 64 bytes |

## Size summary

| Region | Size |
|--------|------|
| Header | 16 B |
| Identity | 48 B |
| Wallet + Runtime | 24 B |
| Session | 16 B |
| Logs | 112 B |
| **Buffer total** | **216 B** |
| Trailer / Meta | 64 B |
| **Total (2× buffer + trailer)** | **496 B** |
