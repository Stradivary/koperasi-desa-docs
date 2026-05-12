# 5. Multitenancy, Auth & Local-first Storage

This section defines the data contracts needed to support multiple koperasi tenants, account management, stronger authentication, and local-first terminal behavior.

## Tenant isolation rules

- Every tenant-owned backend row must include `tenantId`.
- Unique identifiers that users type or see, such as `userId`, `terminalId`, and operator usernames, may be reused only if the governing table defines whether uniqueness is global or tenant-scoped.
- Cache keys, object storage paths, background jobs, and exported reports must be partitioned by `tenantId`.
- Cross-tenant reads and writes are forbidden even for shared infrastructure operators unless they act through an audited break-glass process.

## Auth data boundaries

The authentication model keeps sensitive secrets on the backend and only stores what is required for local operation and tenant binding.

| Category | Stored where | Notes |
|----------|--------------|-------|
| Account credentials | Backend auth tables | Password hash and MFA references only; never replicated client-side |
| Access tokens | Process memory only | Short-lived; discarded on reload or expiry |
| Refresh metadata | Backend and optionally encrypted local cache | Store only hashes or encrypted blobs; do not keep raw refresh secrets in plaintext |

## IndexedDB stores

Clients use IndexedDB for tenant-scoped local state. The essential stores are:

- `tenantContext`: active tenant, selected roles, and last sync time.
- `cardSnapshot`: recent card reads and reconciled card metadata keyed by tenant and card.
- `policyCache`: cached tenant policy documents with expiry.
- `reconciliationOutbox`: pending offline reconciliation events with deterministic idempotency keys.

Implementation may also include additional local stores for refresh state or sync cursors, but keep the core local model simple and tenant-scoped.

## Local-first write rules

- Offline events must be queued locally before the UI reports success.
- Reconciliation retries must be safe and idempotent.
- On successful sync, update the local card snapshot and relevant cache state.
- Tenant logout must clear tenant-scoped caches when required by policy.

## Migration guidance

- Add `tenant_id` to backend rows incrementally, then enforce tenant scope.
- Evolve device enrollment and refresh state only when the implementation needs it.
- Version the local cache schema separately from the card schema so cached state upgrades do not force card replacement.

> Note: later design iterations may extend this model with stronger device enrollment, refresh session tracking, and richer reconciliation metadata while preserving the local-first terminal experience.
