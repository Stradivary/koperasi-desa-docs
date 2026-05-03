# 12. Key & Trust Model

## Key hierarchy

- Master backend key (trusted backend)
- Station/gate key for provisioning and session signing
- Terminal session key for offline card interaction
- Card-specific derived keys for AES and HMAC

## Session grant

- Backend issues a session grant containing:
  - session key
  - key version
  - expiry timestamp
  - allowed role/operation scope
  - backend signature
- Session grants are short-lived (e.g. 6–24 hours) and stored only in the terminal or gate runtime, not on-card.

## Trust model

- Backend is the root of trust.
- Stations and gates are trusted devices with limited offline authority.
- The card is the source of truth for balance and tamper state.
- Any offline terminal operation must still validate state and respect session constraints.

## Integrity-first principle

- Card state is tamper-evident: integrity wins over availability.
- The system treats a compromised card as untrusted and blocks it rather than accepting inconsistent state.
