# 2. System Architecture

This section describes how the browser app, terminal, NFC card, and backend service work together. It defines the core actors and the common flow that application code should follow.

## Roles

- **Card**: holds wallet state, transaction history, status, and cryptographic validation metadata in a compact binary NFC payload. The card is the authoritative source of truth for the current balance and state.
- **Frontend**: a browser-based app using TanStack Start conventions with Web NFC and Web Crypto. Runs as a member view (read-only) or terminal mode (read-write) depending on authentication context.
- **Backend**: a Nitro-compatible service responsible for session grant issuance and rotation, policy enforcement, terminal authentication, reconciliation ingestion, and audit logging.
- **Terminal**: the user-facing interaction layer running the frontend in terminal mode. Enforces local transaction rules, queues offline events, and uploads them when connectivity returns.
- **Station / Gate**: specialized terminal roles. The station handles card issuance and top-up. The gate handles check-in and check-out transitions.

## Normal online flow

1. Terminal authenticates with the backend and obtains a fresh session grant.
2. User taps card to the terminal.
3. Frontend reads the card using Web NFC and decrypts the payload with the session key.
4. Frontend validates cryptographic integrity, counter, log chain, and status locally.
5. Terminal checks session expiry, status codes, and risk limits.
6. Terminal constructs the updated payload, writes it to the inactive buffer, verifies the write, then flips `activePtr`.
7. Terminal queues a reconciliation event and uploads it to the backend in the background.

## Offline flow

1. Terminal uses a cached session grant if the backend is unreachable.
2. Steps 2–6 above proceed identically using the locally held grant.
3. Reconciliation events accumulate in browser-managed storage.
4. When backend connectivity is restored, the terminal flushes the event queue.

## Connectivity states

| State | Session grant | Writes | Reconciliation |
|-------|--------------|--------|----------------|
| Online | Fresh from backend | Allowed | Immediate upload |
| Offline (valid grant) | Cached | Allowed within grant scope | Queued |
| Offline (expired grant) | None | Blocked | Queued |

## Error handling

- Cryptographic validation failure → card is marked suspicious; no write attempted.
- Write verification failure → `activePtr` is not flipped; previous state is preserved.
- Backend unreachable at grant refresh → use cached grant if not expired; otherwise block high-risk operations.
- Invalid state transition → log event and reject the operation without modifying the card.
