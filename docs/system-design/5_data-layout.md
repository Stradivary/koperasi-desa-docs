# 5. Data Layout

## Zones

The card payload is logically divided into three zones:

- **Zone A**: Active Buffer (~214 bytes)
- **Zone B**: Shadow Buffer (~214 bytes)
- **Zone C**: Trailer / Meta (~64 bytes)

This layout supports atomic updates and rollback safety within NTAG215's 492-byte usable capacity.

## Core payload structure

### Identity Block (~48B)

- `name`: 32 bytes
- `userId`: 4 bytes
- `gender`: 1 byte
- `status`: 1 byte
- `createdAt`: 4 bytes
- `reserved`: 6 bytes

### Wallet + Runtime Block (~24B)

- `balance`: 4 bytes (uint32)
- `lastBalance`: 4 bytes
- `counter`: 8 bytes (uint64 monotonic)
- `lastTimestamp`: 4 bytes
- `state`: 1 byte
- `flags`: 3 bytes

### Session Block (~16B)

- `startTime`: 4 bytes
- `endTime`: 4 bytes
- `terminalId`: 2 bytes
- `reserved`: 6 bytes

### Logs (~112B)

- Each log entry size: 16 bytes
- Fields:
  - `deltaTime`: 2 bytes
  - `amount`: 3 bytes (uint24)
  - `balanceAfter`: 4 bytes
  - `flags/type`: 1 byte
  - `hash`: 6 bytes
- Capacity: ~7 logs on NTAG215

### Trailer / Meta (~64B)

- `expiresAt`: 4 bytes
- `keyVersion`: 1 byte
- `rootHash`: 6 bytes
- `counterBind`: 4 bytes
- `reserved`: 9 bytes
- `HMAC`: 8 bytes
- `activePtr`: 1 byte
- `padding`: remainder
