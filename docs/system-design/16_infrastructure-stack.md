# 16. Infrastructure & Stack

## Runtime and platform

- Cloudflare Workers / Pages for backend and edge services.
- KV for fast session and blacklist state.
- R2 for larger exportable storage or card audit logs.
- SQLite or Cloudflare D1 for transaction reconciliation.
- Per-tenant logical isolation enforced in every storage and cache key by `tenantId`.

## App stack

- Frontend: React / TypeScript / Web NFC / Web Crypto.
- Backends: edge workers with zero-trust APIs.
- Local cache for offline terminal validation.
- IndexedDB-backed local replica and outbox for local-first operator workflows.

## Deployment model

- Multi-tenant environment with shared backend services.
- Shared infrastructure is acceptable only when tenant boundaries are enforced in schema, access tokens, cache namespaces, and reconciliation jobs.
- Separate station/gate/terminal client builds for role-specific behavior.
- Global edge distribution for low-latency validation.
