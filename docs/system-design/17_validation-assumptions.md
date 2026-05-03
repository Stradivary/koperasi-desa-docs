# 17. Time, Validation & Assumptions

## Time model

- All timestamps are in UTC seconds.
- Device clocks must be reasonably accurate; drift is allowed up to 1 hour between terminal and gate.
- Session windows are bounded on the card and by backend grants.

## Validation rules

- Check-in must complete before any terminal operation.
- Check-out should occur within 24 hours.
- Invalid transitions or timestamp inconsistencies are treated as tamper signals.

## Assumptions

- Users can carry cards and tap them properly.
- Terminal devices can connect to backend periodically.
- Physical card printing, personalization, and government integrations are out of scope.
