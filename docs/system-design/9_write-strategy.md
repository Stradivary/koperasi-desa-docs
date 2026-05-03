# 9. Write Strategy (A/B Buffer)

## Update flow

1. Build the new payload in memory.
2. Encrypt and compute HMAC.
3. Write to the inactive buffer zone.
4. Read back and verify the write.
5. Flip `activePtr` to commit the new buffer.

## Benefits

- Ensures atomic updates.
- Prevents partial writes from corrupting the active state.
- Protects card state during power loss or NFC communication failure.

## Safety model

- The active buffer remains intact until a complete valid update is committed.
- The shadow buffer can be overwritten safely.
- Verification after the write prevents bad state transitions.
