# 14. Transaction Log Structure

## Log slots

- The card stores a fixed number of transaction log slots.
- Each slot is a compact 16-byte record with a truncated hash.
- Older logs may be overwritten in a ring-buffer fashion.

## Slot format

- `deltaTime`: 2 bytes
- `amount`: 3 bytes
- `balanceAfter`: 4 bytes
- `flags/type`: 1 byte
- `hash`: 6 bytes

## Chain semantics

- The log chain uses a 2-bit state idea to detect slot reuse and ordering.
- Each log hash is computed from the log data and the previous slot hash.
- A dedicated chain head in the trailer anchors the current log head.

## Security guarantees

- Any modification to an entry invalidates the subsequent chain.
- Overwriting the oldest slot is valid only when the ring buffer advances cleanly.
