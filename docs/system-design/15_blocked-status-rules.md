# 15. Blocked / Status Rules

## Status codes

- `0` = ACTIVE
- `1` = BLOCKED_TAMPER
- `2` = BLOCKED_FRAUD
- `3` = BLOCKED_EXPIRED
- `4` = BLOCKED_ADMIN

## Blocked behavior

- Blocked cards are read-only and cannot accept further value changes.
- A blocked status persists until the card is reissued or retired.
- Repeated tampering or invalid transitions escalate to permanent block.

## Exceptions and warnings

- Terminal warnings may be issued for suspicious transitions before final block.
- Expired cards are rejected for new operations but may still allow status reads.
