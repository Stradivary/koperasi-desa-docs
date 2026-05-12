# ADR-010: Tenant-Scoped Local Replicas and Explicit Tenant Selection

**Date**: 2026-05-12  
**Status**: Accepted

## Context

The system supports multiple koperasi tenants and operator accounts that may belong to more than one tenant. Local terminal data must not mix tenant state, and each tenant’s policies, cards, and reconciliation events must be isolated.

Without explicit tenant scoping, local caches can become inconsistent, and user actions may be applied to the wrong tenant context.

## Decision

Implement a simple tenant-scoped local model:

- Bind local data to `tenantId` at the storage layer.
- Maintain per-tenant local replicas for cards, policies, account profiles, and unsent reconciliation events.
- Require explicit tenant selection after login before accessing terminal or member flows.
- Use tenant-scoped paths or state contexts (for example, `/tenant/:tenantId/terminal`) to ensure all UI operations are tenant-aware.
- Keep tenant state isolated in IndexedDB and on-device storage.

## Consequences

**Positive:**

- Prevents accidental cross-tenant data leakage in local caches.
- Makes tenant ownership explicit and easier to audit.
- Supports simple multitenancy while preserving the local-first architecture.
- Enables targeted sync and reconciliation per tenant.

**Negative:**

- Adds user interface complexity for tenant selection and tenant-scoped navigation.
- Requires careful storage and cache keying strategies to maintain tenant isolation.
- Increases local storage usage proportional to the number of tenants an operator accesses.

**Risks:**

- Incorrect tenant scoping could cause operations to execute against the wrong tenant’s data.
- Local replicas must be carefully invalidated when tenant access changes.

## Alternatives Considered

| Option | Reason Rejected |
|--------|-----------------|
| **Single shared local cache with tenant metadata on each entry** | More error-prone and harder to enforce at the UI/terminal boundary. |
| **Remote tenant scoping only** | Breaks offline-first operation because the tenant context would be unavailable if remote lookup fails. |
| **No explicit tenant selector** | Increases risk of accidental tenant mis-selection and data mixing. |

## References

- Tech Specs [§8 Backend & Frontend Interfaces](../tech-specs/8_backend-frontend-interfaces.md)
- Tech Specs [§16 Infrastructure Stack](../tech-specs/16_infrastructure-stack.md)
