# ADR-011: Outbox-First Reconciliation Sync and Conflict Resolution

**Date**: 2026-05-12  
**Status**: Accepted

## Context

Terminal workflows can create offline events while disconnected. These events must eventually be reconciled with backend records, and the order of sync operations affects correctness and conflict handling.

A naive sync approach that pulls remote state first and then pushes local events can overwrite or invalidate pending offline work. The system also needs deterministic handling for retries and duplicated uploads.

## Decision

Adopt an **outbox-first** sync model:

- Store offline write events in a local reconciliation outbox.
- On reconnect, upload the outbox first before pulling server checkpoints.
- Use deterministic idempotency keys so retries do not duplicate effects.
- Treat the backend as authoritative for backend records and terminal metadata.
- Treat the card as authoritative for unreconciled offline balance and card state until reconciliation completes.
- Resolve conflicts by preserving locally committed card operations while allowing the backend to reconcile global records and flag inconsistencies.

## Consequences

**Positive:**

- Offline events are safely flushed before the client refreshes remote state.
- The model reduces the risk of losing offline writes due to stale server pulls.
- Deterministic idempotency facilitates retry safety in unreliable networks.
- The flow supports disconnected operation with minimal risk of local/remote divergence.

**Negative:**

- Reconciliation and conflict resolution logic becomes more complex.
- Backend and frontend must agree on idempotency and event semantics.
- Some conflicts still require manual or operational intervention if remote state has diverged significantly.

**Risks:**

- If the outbox upload fails silently, local state may appear committed while the backend has not received the event.
- Incorrect idempotency keys could lead to duplicate reconciliation records.
- Card-authoritative offline balance can temporarily diverge from backend totals until reconciliation completes.

## Alternatives Considered

| Option                                                  | Reason Rejected                                                                                          |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Pull-before-push sync**                               | Can drop or overwrite pending offline writes with newer server state.                                    |
| **Immediate direct backend commit for every operation** | Breaks offline-first requirements and reduces terminal availability.                                     |
| **Two-way merge on every reconnect**                    | Requires more coordination and increases complexity without clear benefit for the outbox-first use case. |

## References

- Tech Specs [§8 Backend & Frontend Interfaces](../tech-specs/8_backend-frontend-interfaces.md)
- Tech Specs [§10 Implementation Notes](../tech-specs/10_implementation-notes.md)
- Tech Specs [§16 Infrastructure Stack](../tech-specs/16_infrastructure-stack.md)
