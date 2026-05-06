# 4. Card State Machine

## States

| State | Meaning |
|-------|---------|
| `IDLE` | Card is issued but no session is open. Waiting for gate check-in. |
| `CHECKED_IN` | Gate has opened a session. Terminal debit operations are permitted. |
| `TERMINAL_OPERATION` | A terminal is actively processing a write. Intermediate state during an A/B buffer flip. |
| `CHECKED_OUT` | Session was closed by a gate. Card is reconcilable; no further debits until next check-in. |

## Valid transitions

```
IDLE → CHECKED_IN → TERMINAL_OPERATION → CHECKED_IN (loop until check-out)
                                        ↘
                                     CHECKED_OUT → IDLE
```

## Rules

- A terminal debit tap is rejected if the card is not in `CHECKED_IN`.
- The card must transition to `CHECKED_OUT` within **24 hours** of check-in.
- Terminal and gate clocks may drift by up to **1 hour** during validation.
- Invalid transitions must be treated as suspicious or tampered state.

## Expired session (no checkout within 24 hours)

If a card remains in `CHECKED_IN` or `TERMINAL_OPERATION` more than 24 hours after `session.startTime`:

- **The session is treated as expired.** The card does not automatically block, but no new terminal debit operations may begin.
- **The Gate app is responsible for resolution.** When the card is next tapped at a gate, the gate detects the stale session (by comparing `startTime` to the current clock) and presents the operator with a forced check-out prompt.
- **Forced check-out**: the gate writes `CHECKED_OUT` and sets `endTime = now`. This closes the session without the member re-tapping at the entry gate. The reconciliation batch will include the forced close event.
- **If no gate tap occurs**, the card remains stuck in the stale session. A Station terminal can also perform a forced check-out during a top-up or support interaction.
- **This is not a tamper condition.** A stale session is treated as an operational error (e.g., member exited without tapping out), not a fraud signal. The card is not blocked.

## Operational behaviour

- `CHECKED_IN` indicates the card is authorised for a session.
- `TERMINAL_OPERATION` indicates an active transaction in progress (A/B write not yet committed). If a read finds the card in this state, the terminal should verify the inactive buffer before deciding whether to recover or escalate.
- `CHECKED_OUT` indicates the session is complete and the card may be reconciled.
