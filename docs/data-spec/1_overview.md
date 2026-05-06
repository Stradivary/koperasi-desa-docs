# 1. Overview

## Storage areas

The offline NFC wallet system has two distinct storage areas, each owned by a different layer of the architecture:

| Area | Location | Owner | Access |
|------|----------|-------|--------|
| **Card binary payload** | NTAG215 NFC chip | Terminal / card hardware | Read: any terminal or gate app. Write: terminal or station with valid session grant |
| **Backend database** | Server (PostgreSQL) | Backend service | Read/write: backend API only. Never accessed directly by terminals |

## Data flow

```
Card payload (binary)
        │
        │  NFC read / write
        ▼
  Terminal app
        │
        │  POST /api/reconcile
        │  GET  /api/cards/:id
        │  POST /api/cards
        ▼
  Backend service
        │
        │  SQL
        ▼
  PostgreSQL database
```

Card state is the **primary source of truth for offline operations**. The backend database is the **reconciliation and audit record**. In cases of conflict, the backend audit log wins (see [System Design §4](../system-design/4_card-state-machine.md) and [Tech Specs §5](../tech-specs/5_tamper-detection-validation.md)).

## Ownership rules

- The card binary is **write-controlled by session grant**: only a terminal holding a valid, signed session grant may write to the card.
- The backend database is **write-controlled by the API**: no terminal or client may write to it directly.
- `cardId` is the **join key** between the card payload and the backend record. It is a 6-byte value set at issuance and never reused.

## What is NOT stored

The following data is intentionally absent from both storage areas:

| Excluded | Reason |
|----------|--------|
| Session keys | Held in terminal process memory only; never persisted (see [Tech Specs §12](../tech-specs/12_key-hierarchy-session-grants.md)) |
| Backend session grant payloads | Ephemeral; not persisted server-side after issuance |
| Raw NDEF / NFC low-level protocol frames | Out of scope; handled by the NFC hardware layer |
| Personally identifiable data beyond `name` and `userId` | Minimised by design; see [Product Spec §5 Out of Scope](../product-spec/5_out-of-scope.md) |
