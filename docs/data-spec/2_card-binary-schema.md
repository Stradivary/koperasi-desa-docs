# 2. Card Binary Schema

The NFC card payload is a 496-byte binary structure stored on an NTAG215 chip. It is divided into three physical regions: **Buffer A**, **Buffer B** (A/B shadow pair), and a shared **Trailer / Meta** block.

> Upstream sources: [System Design §5 Data Layout](../system-design/5_data-layout.md), [Tech Specs §3 Card Storage Model](../tech-specs/3_card-storage-model.md).

---

## Memory map

| Region | Byte range | Size | Description |
|--------|-----------|------|-------------|
| Buffer A | 0–215 | 216 B | Active or shadow card state (determined by `activePtr`) |
| Buffer B | 216–431 | 216 B | Active or shadow card state (the other buffer) |
| Trailer / Meta | 432–495 | 64 B | Cryptographic anchors, key version, buffer pointer |

`activePtr = 0` means Buffer A is the current authoritative state. `activePtr = 1` means Buffer B is current.

---

## Buffer layout (216 bytes per buffer)

Each buffer contains the following blocks in fixed order:

| Block | Offset | Size | Description |
|-------|--------|------|-------------|
| Header / Identifier | 0 | 16 B | Magic bytes, schema version, card ID |
| Identity | 16 | 48 B | Cardholder name, user ID, status |
| Wallet + Runtime | 64 | 24 B | Balance, counter, session state |
| Session | 88 | 16 B | Session open/close timestamps, terminal ID |
| Log region | 104 | 112 B | Ring buffer of 7 transaction log entries × 16 B each |

### Header / Identifier Block (16 bytes)

| Field | Offset | Size | Type | Description | Constraints |
|-------|--------|------|------|-------------|-------------|
| `magic` | 0 | 4 B | bytes | Fixed payload identifier | Must equal `0x4B4F5057` ("KOPW"); reject card if mismatch |
| `version` | 4 | 1 B | uint8 | Card layout schema version | Current: `1`; reject if unsupported version |
| `type` | 5 | 1 B | uint8 | Payload product class | Current: `0x01` (cooperative wallet) |
| `cardId` | 6 | 6 B | bytes | Unique card identifier set at issuance | Immutable after issuance; used as backend join key |
| `reserved` | 12 | 4 B | — | Reserved for future use | Must be zeroed on write; ignored on read |

### Identity Block (48 bytes)

| Field | Offset | Size | Type | Description | Constraints |
|-------|--------|------|------|-------------|-------------|
| `name` | 16 | 32 B | UTF-8 | Cardholder display name, null-padded | Max 31 meaningful bytes + null terminator |
| `userId` | 48 | 4 B | uint32 | Backend user account ID | Must match a registered user; set at issuance |
| `gender` | 52 | 1 B | uint8 | Gender code: `0` = unspecified, `1` = male, `2` = female | Application-defined; not used in financial logic |
| `status` | 53 | 1 B | uint8 | Card health status code | See [status codes table](#status-codes) below |
| `createdAt` | 54 | 4 B | uint32 | Issuance timestamp (UTC seconds) | Immutable after issuance |
| `reserved` | 58 | 6 B | — | Reserved | Must be zeroed on write; ignored on read |

#### Status codes

| Value | Name | Description |
|-------|------|-------------|
| `0` | `ACTIVE` | Normal operation |
| `1` | `BLOCKED_TAMPER` | Cryptographic or chain integrity failure |
| `2` | `BLOCKED_FRAUD` | Suspicious behaviour detected |
| `3` | `BLOCKED_EXPIRED` | Card past its `expiresAt` date |
| `4` | `BLOCKED_ADMIN` | Manually decommissioned by operator |

> Full transition rules: [Tech Specs §15 Status Codes & Block Rules](../tech-specs/15_status-codes-block-rules.md).

### Wallet + Runtime Block (24 bytes)

| Field | Offset | Size | Type | Description | Constraints |
|-------|--------|------|------|-------------|-------------|
| `balance` | 64 | 4 B | uint32 | Current balance in smallest currency unit (integer IDR) | Max `4,000,000,000`; effective ceiling is Rp 16,000,000 by policy |
| `lastBalance` | 68 | 4 B | uint32 | Balance before most recent transaction | Used for rollback detection; must equal previous `balance` |
| `counter` | 72 | 8 B | uint64 | Monotonically increasing write counter | Never decremented; starts at `0` at issuance; anti-replay key |
| `lastTimestamp` | 80 | 4 B | uint32 | Timestamp of most recent write (UTC seconds) | Must not be earlier than previous `lastTimestamp` |
| `state` | 84 | 1 B | uint8 | Card lifecycle / session state | See [session state codes](#session-state-codes) below |
| `flags` | 85 | 3 B | bits | Feature and operational flags | See [flags layout](#flags-layout) below |

#### Session state codes

| Value | Name | Description |
|-------|------|-------------|
| `0` | `IDLE` | No active session; card is at rest |
| `1` | `CHECKED_IN` | Active session opened by a gate check-in |
| `2` | `CHECKED_OUT` | Session closed by a gate check-out |

> Full state machine and transition rules: [System Design §4 Card State Machine](../system-design/4_card-state-machine.md), [Tech Specs §6 State Machine & Session Rules](../tech-specs/6_state-machine-session-rules.md).

#### Flags layout (3 bytes / 24 bits)

| Bits | Name | Description |
|------|------|-------------|
| 0 | `offlineSession` | `1` = most recent write occurred while terminal was offline |
| 1 | `pendingReconcile` | `1` = one or more log entries not yet reconciled with backend |
| 23:2 | reserved | Must be zeroed on write; ignored on read |

### Session Block (16 bytes)

| Field | Offset | Size | Type | Description | Constraints |
|-------|--------|------|------|-------------|-------------|
| `startTime` | 88 | 4 B | uint32 | Session open timestamp (UTC seconds) | Set on `CHECKED_IN`; used as chain initialisation anchor |
| `endTime` | 92 | 4 B | uint32 | Session close timestamp (UTC seconds) | Zero while session is open; set on `CHECKED_OUT` |
| `terminalId` | 96 | 2 B | uint16 | ID of terminal that opened the session | Backend-assigned terminal identifier |
| `reserved` | 98 | 6 B | — | Reserved | Must be zeroed on write; ignored on read |

### Log Region (112 bytes — 7 entries × 16 bytes)

Fixed-capacity ring buffer. When full, the oldest entry is overwritten. Current write position is tracked implicitly via `rootHash` in the trailer.

> Full log entry definition, chain formula, and integrity rules: [Tech Specs §14 Transaction Log Format](../tech-specs/14_transaction-log-format.md).

**Log entry (16 bytes):**

| Field | Offset (within entry) | Size | Type | Description | Constraints |
|-------|----------------------|------|------|-------------|-------------|
| `deltaTime` | 0 | 2 B | uint16 | Seconds since `session.startTime` | Wraps at 65,535 s (~18 h); stale session if exceeded |
| `amount` | 2 | 3 B | uint24 | Transaction amount (integer IDR) | `0` for state-only transitions (check-in/out) |
| `balanceAfter` | 5 | 4 B | uint32 | Balance after this transaction | Must be consistent with prior `balance` and `amount` |
| `flags/type` | 9 | 1 B | uint8 | Transaction type + flags | See [log flags table](#log-flags) below |
| `hash` | 10 | 6 B | bytes | Truncated SHA-256 chain hash | `SHA256(deltaTime \|\| amount \|\| balanceAfter \|\| flags \|\| prevHash)[0..5]` |

#### Log flags (`flags/type` field)

| Bits | Name | Values |
|------|------|--------|
| 3:0 | `txType` | `0x0` debit, `0x1` credit/top-up, `0x2` check-in, `0x3` check-out, `0xF` admin |
| 4 | `offlineFlag` | `1` = offline transaction |
| 5 | `suspectFlag` | `1` = terminal flagged as suspicious |
| 7:6 | reserved | Must be zero on write |

---

## Trailer / Meta (64 bytes, offset 432)

The trailer is written **last** in every update cycle. It cryptographically binds the active buffer and is the only block read to determine which buffer is authoritative.

| Field | Offset | Size | Type | Description | Constraints |
|-------|--------|------|------|-------------|-------------|
| `expiresAt` | 432 | 4 B | uint32 | Card expiry timestamp (UTC seconds) | Card is `BLOCKED_EXPIRED` if current time > `expiresAt` |
| `keyVersion` | 436 | 1 B | uint8 | Key set version used to encrypt/authenticate this card | Determines which master key is used for HMAC derivation |
| `rootHash` | 437 | 6 B | bytes | Truncated SHA-256 of the most recent log entry hash | Chain head; ties log sequence to trailer HMAC |
| `counterBind` | 443 | 4 B | uint32 | Lower 32 bits of `counter` included in HMAC input | Anti-replay binding in the HMAC |
| `reserved` | 447 | 9 B | — | Reserved | Must be zeroed on write |
| `HMAC` | 456 | 8 B | bytes | Truncated HMAC-SHA256 over payload and trailer fields | Covers: active buffer bytes + `expiresAt` + `keyVersion` + `rootHash` + `counterBind` |
| `activePtr` | 464 | 1 B | uint8 | Active buffer pointer: `0` = Buffer A, `1` = Buffer B | Flipped only after new buffer is fully written and verified |
| `padding` | 465 | 31 B | — | Zero-padding to fill 64 bytes | |

---

## Size summary

| Region | Size |
|--------|------|
| Buffer A | 216 B |
| Buffer B | 216 B |
| Trailer / Meta | 64 B |
| **Total** | **496 B** |

> This fits within the 504-byte usable user memory of an NTAG215 (132 pages × 4 bytes, minus lock and configuration bytes).
