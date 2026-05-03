# 14. Transaction Log Format

## Log entry definition (16 bytes)

| Field | Size | Type | Description |
|-------|------|------|-------------|
| `deltaTime` | 2 B | uint16 | Seconds elapsed since `session.startTime`; wraps at 65535 s (~18 h) |
| `amount` | 3 B | uint24 | Transaction amount in smallest currency unit; unsigned |
| `balanceAfter` | 4 B | uint32 | Balance after this transaction; used for consistency checks |
| `flags/type` | 1 B | uint8 | Transaction type and operational flags (see below) |
| `hash` | 6 B | bytes | Truncated SHA-256 chain hash linking this entry to the previous one |

**Total per entry: 16 bytes. Capacity on NTAG215: 7 entries (112 bytes).**

## `flags/type` field (1 byte)

| Bits | Name | Values / Meaning |
|------|------|------------------|
| 3:0 | `txType` | `0x0` = debit, `0x1` = credit/top-up, `0x2` = check-in, `0x3` = check-out, `0xF` = system/admin |
| 4 | `offlineFlag` | `1` = transaction was processed offline without backend confirmation |
| 5 | `suspectFlag` | `1` = terminal flagged this transaction as potentially suspicious |
| 7:6 | reserved | Must be zero on write; ignored on read |

## Ring buffer

- Logs are stored in a fixed-size ring buffer of 7 slots.
- When the buffer is full, the oldest entry is overwritten.
- The current write position is tracked implicitly by the `rootHash` trailer field (which always equals the hash of the most recent entry).
- On readback, the terminal reconstructs the chain from the anchor and validates each entry in order.

## Chain initialization and integrity

- The first entry in a session uses `session.startTime` bytes (4 bytes, little-endian, zero-padded to 6) as the initial `prevHash`.
- Each subsequent entry: `hash[n] = SHA256(deltaTime || amount || balanceAfter || flags || hash[n-1])[0..5]`
- `rootHash` in the trailer equals `hash[lastEntry]` — the chain head.
- After a ring buffer wrap, the chain continues from the overwritten slot's predecessor; the full chain back to session start is no longer available, but each surviving entry is still individually verifiable from its predecessor.

## Integrity guarantees

- Any modification to a log entry invalidates its hash and all subsequent hashes.
- The `rootHash` trailer field ties the chain head to the overall card authentication (HMAC).
- A chain break is a hard tamper condition (see §5).
