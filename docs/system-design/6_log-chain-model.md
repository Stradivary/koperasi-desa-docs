# 6. Log Chain Model

## Log entry structure

Each log entry contains:

- `deltaTime` (2 bytes)
- `amount` (3 bytes)
- `balanceAfter` (4 bytes)
- `flags/type` (1 byte)
- `hash` (6 bytes)

## Hash chaining

Each log hash is computed as:

```txt
hash = SHA256(logData + prevHash)[0..6]
```

- `prevHash` is the hash of the previous log entry.
- The first log is anchored to `session.startTime`.

## Security guarantees

- Modifying a single log breaks the chain.
- Partial tampering becomes detectable through hash validation.
- The final `rootHash` binds the complete log sequence.
