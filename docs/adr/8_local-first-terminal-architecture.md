# ADR-008: Local-First Terminal Architecture with Optional Backend Sync

**Date**: 2026-05-12  
**Status**: Accepted

## Context

The application must work reliably in environments with intermittent or absent internet connectivity. Terminals are browser-based devices that read and write NFC cards in the field, and the system must support financial transaction flows even when remote services are unavailable.

The existing architecture includes a backend service for session grants, policy enforcement, reconciliation, and audit logging. However, making backend availability a hard requirement for every terminal transaction would reduce usability in local-area deployments, increase latency, and make the system fragile in limited-network settings.

## Decision

The terminal architecture is defined as local-first:

- Terminal transaction logic runs in the browser on the end device.
- The browser maintains local validation and write paths for NFC card payloads.
- The backend is an optional sync/orchestration layer used for:
  - session grant bootstrapping and refresh,
  - policy metadata refresh,
  - reconciliation and audit upload,
  - tenant metadata and bootstrap.
- A valid cached local session grant is sufficient for offline terminal writes within the grant scope.
- Core card read/write behavior does not require backend availability while the cached grant remains valid.

## Consequences

**Positive:**

- The system is resilient to intermittent connectivity.
- Terminals can continue performing card reads and writes in local-area or offline deployments.
- Users experience lower latency for NFC operations because the critical path is local.
- The backend can be simplified to an optional sync/orchestration role rather than a full transaction host.

**Negative:**

- Local terminal logic must handle more complex state and error cases.
- More effort is required to keep local and remote state consistent during reconnects.
- Session grant caching and validation logic must be implemented carefully.

**Risks:**

- If local grant validation is implemented incorrectly, offline writes could be allowed beyond intended risk boundaries.
- The terminal must still safely reject suspicious card states even without backend confirmation.
- A purely local-first model may make some backend-driven policies harder to enforce in real time.

## Alternatives Considered

| Option | Reason Rejected |
|--------|-----------------|
| **Fully server-driven transaction engine** | Requires backend connectivity for every transaction, undermining offline usability and local-area adoption. |
| **Backend-backed UI with local cache only for read state** | Still leaves writes blocked when offline; does not satisfy the offline terminal requirement. |
| **Peer-to-peer sync between terminals** | Adds complexity and security risk; not aligned with the current deployment model or tenant trust boundaries. |

## References

- Tech Specs [§8 Backend & Frontend Interfaces](../tech-specs/8_backend-frontend-interfaces.md)
- Tech Specs [§10 Implementation Notes](../tech-specs/10_implementation-notes.md)
- Tech Specs [§16 Infrastructure Stack](../tech-specs/16_infrastructure-stack.md)
