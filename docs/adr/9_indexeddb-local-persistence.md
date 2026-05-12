# ADR-009: IndexedDB as Primary Browser Persistence with Typed Local State

**Date**: 2026-05-12  
**Status**: Accepted

## Context

Browser terminals must retain durable local state for tenant data, cached policy, session snapshots, NFC card caches, and reconciliation outboxes. The storage layer must survive browser restarts and support larger payloads than `localStorage` can reliably hold.

The application also needs a developer-friendly local data layer with typed access patterns and schema evolution support.

## Decision

Use **IndexedDB** as the primary browser-local persistence layer for terminal state.

- Store per-tenant local replicas, operator session snapshots, card cache, policy cache, and reconciliation outbox in IndexedDB.
- Use **Drizzle** or similar typed layer on top of IndexedDB to provide a query-safe, schema-driven developer experience.
- Use **SQLite** only as a local-native fallback for desktop or embedded native deployments where file-backed durability is preferable.
- Do not use `localStorage` for terminal data because it is synchronous, size-limited, and not durable enough for offline-first reconciliation.

## Consequences

**Positive:**

- IndexedDB provides durable, asynchronous storage suitable for offline terminal state.
- Typed persistence reduces schema drift and improves developer productivity.
- Browser storage can hold larger outbox and cached state than `localStorage`.
- SQLite fallback allows the same local-first model to work on native/desktop deployments.

**Negative:**

- IndexedDB has a more complex API than simpler browser storage options.
- Browser compatibility and debugging can be more difficult than with JSON-based localStorage.
- Maintaining schema migrations in IndexedDB requires deliberate version control logic.

**Risks:**

- Improper schema migration logic could corrupt tenant replicas or outbox state.
- Typed persistence layers must be kept aligned with card and backend schema contracts.

## Alternatives Considered

| Option | Reason Rejected |
|--------|-----------------|
| **localStorage** | Insufficient capacity, synchronous I/O, not durable enough for terminal workflows. |
| **Service Worker Cache / Cache Storage** | Not designed for structured transactional data or fine-grained schema control. |
| **Remote persistence only** | Breaks offline-first requirements and increases dependency on backend availability. |
| **Custom IndexedDB wrapper without typed layer** | Increases risk of schema drift and developer errors. |

## References

- Tech Specs [§8 Backend & Frontend Interfaces](../tech-specs/8_backend-frontend-interfaces.md)
- Tech Specs [§10 Implementation Notes](../tech-specs/10_implementation-notes.md)
- Tech Specs [§16 Infrastructure Stack](../tech-specs/16_infrastructure-stack.md)
