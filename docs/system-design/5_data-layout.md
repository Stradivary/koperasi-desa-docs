# 5. Data Layout

## Zones

The card payload is divided into three physical zones, each with a distinct role:

| Zone                        | Size (NTAG215) | Purpose                                                                                                                                                              |
| --------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Zone A — Active Buffer**  | ~216 bytes     | The currently authoritative copy of card state. All reads use this zone. Identified by `activePtr` in the trailer.                                                   |
| **Zone B — Shadow Buffer**  | ~216 bytes     | A mirror of Zone A used as the write target during an update. Becomes the new active zone after a write is fully verified. Never read directly by application logic. |
| **Zone C — Trailer / Meta** | ~64 bytes      | Cryptographic anchors and metadata that bind Zones A and B. Contains the HMAC, `rootHash`, `activePtr`, and `keyVersion`. Always written last.                       |

**Why three zones?** NFC writes are not atomic — a tap interruption mid-write can leave partial state. Zones A and B implement an A/B buffer pattern: Zone A is never touched until Zone B has been fully written and verified. Zone C's `activePtr` is flipped only after verification succeeds. This guarantees the card always has exactly one known-good state. See [§9 Write Strategy](9_write-strategy.md).

## Core payload structure

### Identity Block

Holds the cardholder's static identity and the card's current health status. Fields: `name`, `userId`, `gender`, `status`, `createdAt`.

- `status` is the card health code (ACTIVE, BLOCKED\_\*, etc. — see [§11](11_card-status-enforcement.md)). It is stored in the identity block because it must be readable even when the wallet state is otherwise invalid.

### Wallet + Runtime Block

Holds the live financial state and write-ordering fields. Fields: `balance`, `lastBalance`, `counter` (monotonic), `lastTimestamp`, `state`, `flags`.

- `counter` is a `uint64` that increments on every write and is never decremented. It is the primary anti-replay control.
- `lastBalance` and `lastTimestamp` are the balance and timestamp from the previous write, allowing the terminal to detect inconsistency without reading the full log chain.
- `state` is the session lifecycle position (IDLE, CHECKED_IN, etc. — see [§4](4_card-state-machine.md)).

### Session Block

Bounds the current session window. Fields: `startTime`, `endTime`, `terminalId`.

- `startTime` is set when the gate checks in. It is used as the anchor for the log chain hash (first entry's `prevHash` is derived from `startTime`).
- `endTime` is zero while the session is open and set to the checkout timestamp when the gate checks out.
- `terminalId` records which terminal opened the session, for audit purposes.

### Log Region

Fixed-capacity ring buffer of transaction log entries. Each entry records a value change and a chain hash linking it to the previous entry. Capacity is bounded by available card storage.

### Trailer / Meta

Holds verification anchors and key material references. Fields: `expiresAt`, `keyVersion`, `rootHash`, `counterBind`, `HMAC`, `activePtr`.

- `rootHash` is the hash of the most recent log entry — the chain head. It ties the entire log sequence to the HMAC-protected trailer.
- `activePtr` selects which zone (A or B) is the authoritative buffer for this read.

> Exact field sizes, types, and byte offsets: [Tech Specs §3 Card Storage Model](../tech-specs/3_card-storage-model.md).
