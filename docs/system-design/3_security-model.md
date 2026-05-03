# 3. Security Model

## Threat Model

Assume an attacker can:

- Read the entire card contents
- Clone the card onto another tag
- Modify bytes arbitrarily on the card
- Replay old valid card states
- Attempt invalid state transitions

## Defense Strategy

- **AES-GCM** for confidentiality and integrity of encrypted payloads
- **HMAC** to bind card state and metadata
- **Hash chain logs** for tamper-evident audit history
- **Monotonic counter** to prevent rollback and replay
- **Session expiry** to bound the useful lifetime of a state
- **Status flags** to lock cards when compromised

## Security Goals

- Detect unauthorized changes on every read.
- Ensure any modification results in a validation failure.
- Minimize offline trust by verifying most decisions against backend policies when available.
