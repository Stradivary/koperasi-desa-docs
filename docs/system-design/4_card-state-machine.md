# 4. Card State Machine

## States

- `IDLE`
- `CHECKED_IN`
- `TERMINAL_OPERATION`
- `CHECKED_OUT`

## Valid transitions

```txt
IDLE → CHECKED_IN → TERMINAL_OPERATION → CHECKED_OUT
```

## Rules

- A terminal tap is rejected if the card is not in `CHECKED_IN`.
- The card must transition to `CHECKED_OUT` within 24 hours of check-in.
- Terminal and gate clocks may drift by up to 1 hour during validation.
- Invalid transitions must be treated as suspicious or tampered state.

## Operational behavior

- `CHECKED_IN` indicates the card is authorized for a session.
- `TERMINAL_OPERATION` indicates an active transaction or validation in progress.
- `CHECKED_OUT` indicates the session is complete and the card may be reconciled.
