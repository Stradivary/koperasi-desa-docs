# 8. Cryptographic Model

## Encryption

- Use **AES-GCM** to encrypt the full payload before writing.
- Protects confidentiality and ensures ciphertext integrity.
- The encryption key is derived from a session key plus card-specific context.

## Integrity

- Use **HMAC** over the decrypted payload and trailer fields.
- HMAC covers the payload, trailer metadata, counter, and `activePtr`.
- The HMAC is stored inside the trailer for validation on each read.

## Key model

- Session-based keys are valid for a short window (1–24 hours).
- Keys are rotated frequently and versioned.
- Backend manages key issuance, revocation, and compatibility.
