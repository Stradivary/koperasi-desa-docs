# 14. Transaction Log Structure

## Design

The card stores a fixed-capacity ring buffer of transaction log entries. Storage is constrained by card capacity; the buffer holds approximately 7 entries on NTAG215.

Each entry records:
- The time elapsed since session start (as a delta, not an absolute timestamp)
- The transaction amount
- The balance after the transaction
- The transaction type and operational flags
- A truncated hash linking this entry to the previous one

## Ring buffer behaviour

- When the buffer is full, the oldest entry is overwritten.
- The chain continues from the surviving entries — older entries that have been overwritten are no longer individually verifiable, but the surviving chain is still intact.
- The trailer `rootHash` always points to the hash of the most recent entry (the chain head).

## Security guarantees

- Any modification to a surviving entry invalidates its hash and all subsequent hashes.
- Overwriting the oldest slot is only valid when the ring buffer advances normally — an out-of-order overwrite would break the chain.

> Exact field sizes, flag definitions, and chain anchor computation: [Tech Specs §14 Transaction Log Format](../tech-specs/14_transaction-log-format.md).
