# 6. State Machine & Session Rules

## Valid states

| State | Code | Description |
|-------|------|-------------|
| `IDLE` | `0` | Card is issued but no session is open |
| `CHECKED_IN` | `1` | Gate has opened a session; terminal operations are permitted |
| `TERMINAL_OPERATION` | `2` | A terminal is actively processing a transaction |
| `CHECKED_OUT` | `3` | Session has been closed by a gate or timeout |
| `BLOCKED` | `4` | Card is blocked; no value operations are permitted (see §15 for sub-codes) |

## State transitions

| From | To | Trigger | Condition |
|------|----|---------|----------|
| `IDLE` | `CHECKED_IN` | Gate check-in | Valid session grant; card not blocked or expired |
| `CHECKED_IN` | `TERMINAL_OPERATION` | Terminal begins transaction | Valid session grant; `state == CHECKED_IN` |
| `TERMINAL_OPERATION` | `CHECKED_IN` | Transaction completes | Write verified; counter incremented |
| `CHECKED_IN` | `CHECKED_OUT` | Gate check-out | Session was open |
| `CHECKED_OUT` | `IDLE` | Session reset | Applied on next issuance or explicit reset |
| Any non-blocked | `BLOCKED` | Tamper, fraud, expiry, or admin action | Status code set in card identity block |

## Session rules

- Terminal write operations require `state == CHECKED_IN` or `state == TERMINAL_OPERATION`.
- A session must be closed with `CHECKED_OUT` within **24 hours** of `startTime`.
- Clock drift of up to **1 hour** between gate and terminal clocks is tolerated.
- After 24 hours without a check-out, the session is considered expired and no new transactions may begin until the card is reset at a gate.
- The `endTime` field is set when `CHECKED_OUT` is written. A zero `endTime` indicates an open session.

## Invalid transition behavior

- Any transition not listed in the table above is rejected.
- Rejected transitions are treated as potential tamper or fraud events and logged.
- The terminal must not write to the card after detecting an invalid transition.
- If the card is in `TERMINAL_OPERATION` state on read (indicating an aborted previous write), the terminal should verify the inactive buffer's integrity before deciding whether to recover or escalate.
