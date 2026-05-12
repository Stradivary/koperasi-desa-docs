# 1. Overview

## Storage areas

The offline NFC wallet system has three distinct storage areas, each owned by a different layer of the architecture:

| Area | Location | Owner | Access |
|------|----------|-------|--------|
| **Card binary payload** | NTAG215 NFC chip | Terminal / card hardware | Read: any terminal or gate app. Write: terminal or station with valid session grant |
| **Backend database** | Server (SQLite or equivalent lightweight SQL database) | Backend service | Read/write: backend API only. Never accessed directly by terminals |
| **Local-first replica** | Browser IndexedDB on enrolled device | Tenant-scoped client runtime | Read/write: authenticated app only; stores cached policies, account context, card snapshots, and queued outbox events |

## Data flow

```
Card payload (binary)
        │
        │  NFC read / write
        ▼
  Terminal app
        │
        │  IndexedDB replica / outbox
        ▼
 Local-first cache
        │
        │  POST /api/reconcile
        │  GET  /api/cards/:id
        │  POST /api/cards
        ▼
  Backend service
        │
        │  SQL
        ▼
  Lightweight SQL database (SQLite or equivalent)
```

Card state is the **primary source of truth for offline operations**. The backend database is the **reconciliation and audit record**. The local-first replica is a **derived working set** used to keep tenant context, queued mutations, and recent reads available without connectivity. In cases of conflict, the backend audit log wins for server records and the card wins for unreconciled on-card balance until reconciliation completes (see [System Design §4](../system-design/4_card-state-machine.md) and [Tech Specs §5](../tech-specs/5_tamper-detection-validation.md)).

> Note: future iterations may add stronger backend session tracking and audit metadata while preserving the local-first card and tenant replica model.

## Ownership rules

- The card binary is **write-controlled by session grant**: only a terminal holding a valid, signed session grant may write to the card.
- The backend database is **write-controlled by the API**: no terminal or client may write to it directly.
- The local-first replica is **tenant-scoped**: every cached row, outbox event, and auth session must include `tenantId`.
- `cardId` is the **join key** between the card payload and the backend record. It is a 6-byte value set at issuance and never reused.
- `tenantId` is the **mandatory isolation key** for every backend record except global key metadata. No card, user, device, or audit row may exist without tenant ownership.

## What is NOT stored

The following data is intentionally excluded from the storage model:

- Session keys: kept in terminal memory only.
- Raw access tokens and plaintext refresh tokens: never persisted in plaintext tables.
- Backend session grant payloads: ephemeral and not stored long-term.
- Low-level NFC protocol frames: handled by hardware, not persisted in the app.
- Excess PII beyond `name` and `userId`: minimized by design.
