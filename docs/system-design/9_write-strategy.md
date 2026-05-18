# 9. Write Strategy (A/B Buffer)

## Design intent

NFC writes are not atomic at the hardware level. A power loss or tap interruption mid-write can leave the card in a partially written state. The A/B buffer strategy ensures the card always has one known-good buffer, so an interrupted write never corrupts the live card state.

## How it works

The card payload is stored in two mirrored buffers (Zone A and Zone B). At any moment, one buffer is the _active_ buffer (indicated by `activePtr` in the trailer) and the other is the _shadow_ buffer.

A write always targets the shadow buffer first. Only after the write is verified does `activePtr` flip to make the new buffer authoritative. If the write fails or cannot be verified, the active buffer is unchanged and the card remains in its previous valid state.

## Safety guarantees

- The active buffer is never touched until the new buffer is fully verified.
- An interrupted write leaves the shadow buffer in an inconsistent state, which is detectable and recoverable.
- The strategy prevents half-written state from being treated as valid on the next read.

> Exact write procedure and verification steps: [Tech Specs §7 Write & Update Strategy](../tech-specs/7_write-update-strategy.md).
