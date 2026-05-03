# 11. Card Status Enforcement

## Status values

- `0` = ACTIVE
- `1` = BLOCKED_TAMPER
- `2` = BLOCKED_FRAUD
- `3` = EXPIRED

## Behavior

- BLOCKED cards are treated as read-only.
- A blocked card cannot be recovered on-card.
- Reissue is required for any blocked or compromised card.

## Enforcement rules

- Status is checked on every read.
- Any tampering detection should escalate status to `BLOCKED_TAMPER`.
- Expired cards should be rejected for new financial operations.
