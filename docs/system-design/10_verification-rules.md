# 10. Verification Rules

A card is considered tampered if any of the following validations fail:

- AES-GCM decryption fails
- HMAC mismatch
- Invalid log chain
- `rootHash` mismatch with final log hash
- `balance` differs from `lastBalance`
- `balance` differs from the first log's `balanceAfter`
- Monotonic `counter` rollback
- `lastTimestamp` rollback

## Additional checks

- Ensure session window is still valid.
- Validate state transitions against the state machine.
- Reject mode or flag combinations that are inconsistent.
