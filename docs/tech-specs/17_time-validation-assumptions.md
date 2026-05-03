# 17. Time, Validation & Assumptions

## Time management

- All card and session timestamps are **UTC seconds** stored as `uint32` (Unix epoch). The `uint32` ceiling is year 2106, which is sufficient for the system's expected lifetime.
- The **clock drift allowance** between a station/gate and a terminal is **±1 hour** (3600 seconds). Transactions are rejected if the terminal clock appears more than 1 hour ahead of or behind the card's `lastTimestamp`.
- Session expiry is enforced locally on the card by comparing `session.endTime` (or `session.startTime + 24h`) against the terminal's current time.
- Terminals must use a reliable time source (NTP-synced system clock). Time from the NFC card must never be treated as authoritative.

## Timestamp fields and their meaning

| Field | Location | Meaning |
|-------|----------|---------|
| `createdAt` | Identity block | Card issuance timestamp |
| `lastTimestamp` | Wallet+Runtime block | Time of the most recent write |
| `session.startTime` | Session block | Time the current session was opened |
| `session.endTime` | Session block | Time the session was closed (0 = open) |
| `expiresAt` | Trailer | Card expiry; no writes after this time |

## Expiry enforcement

- A card is considered expired if the terminal's current time exceeds `expiresAt`.
- Expired cards must not receive balance updates or new transactions.
- The terminal should set `status = BLOCKED_EXPIRED` on the next write for a card that has passed `expiresAt`.
- Session expiry (24 hours without check-out) blocks new terminal operations but does not automatically block the card; a gate reset clears it.

## Validation assumptions

- Terminal devices maintain periodic backend connectivity (at least once per session grant TTL).
- Users tap cards as intended; physical card loss, environmental RF interference, and NFC reader hardware failures are outside the scope of this specification.
- The system's security model focuses on card integrity and offline cryptographic proof, not on physical card material or printing.

## Out of scope

- Physical card manufacturing, personalization, or government ID integration.
- Payment network tokenization or third-party settlement systems.
- Full end-to-end offline reconciliation beyond the recorded audit entries held in browser storage.
- Real-time fraud scoring or machine-learning-based anomaly detection.
