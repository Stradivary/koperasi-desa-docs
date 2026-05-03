# 2. Hardware Constraints

## Card Type

- NXP NTAG215 / NTAG216
- ISO 14443-3A (NfcA)
- NFC Forum Type 2

## Capacity

- NTAG215 usable storage: ~492 bytes
- NTAG216 usable storage: ~1024 bytes
- Target design assumes NTAG215 and can scale to larger cards like NTAG216 when available.

## Limitations

- No secure element on the card
- No hardware-backed encryption
- Full read/write access by an attacker
- Data stored on the card is not confidentiality-protected without cryptography

## Implications

- System must be **tamper-evident**, not tamper-proof.
- All sensitive state requires cryptographic protection and validation every access.
- Memory usage must be tightly bounded and deterministic.
