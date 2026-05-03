# 7. Trailer / Meta

The trailer stores metadata and verification state for the card.

## Fields

- `expiresAt`: 4 bytes
- `keyVersion`: 1 byte
- `rootHash`: 6 bytes
- `counterBind`: 4 bytes
- `reserved`: 9 bytes
- `HMAC`: 8 bytes
- `activePtr`: 1 byte
- `padding`: rest

## Purpose

- `expiresAt` bounds the card payload lifetime.
- `keyVersion` enables key rotation and compatibility checks.
- `rootHash` is the final log hash anchor.
- `counterBind` binds the monotonic counter into trailer integrity.
- `activePtr` selects which buffer is currently active.

## Integrity

Trailer fields are covered by the HMAC and must be validated on every read.
