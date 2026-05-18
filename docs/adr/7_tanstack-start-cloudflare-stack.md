# ADR-007: TanStack Start and Cloudflare Pages/KV/D1 as the Application Platform

**Date**: 2026-05-06  
**Status**: Accepted

## Context

The application must run in browser environments that support Web NFC and Web Crypto while still offering low-latency APIs for session grants, policy checks, and reconciliation uploads. The platform choice must satisfy four constraints:

1. Frontend and backend should be implemented in a unified TypeScript-first stack with minimal integration friction.
2. Hosting should provide global edge distribution and straightforward CI/CD for docs and app assets.
3. Session and blacklist lookups require a low-latency key-value store near the execution edge.
4. Reconciliation and audit persistence needs a relational store with operational simplicity for modest write-heavy workloads.

Next.js was considered but is not selected for this project because the architecture and existing tech specs already align with TanStack Start conventions and a Cloudflare-native deployment model.

## Decision

The application platform is standardized as follows:

- **Frontend framework**: TanStack Start (React + TypeScript).
- **Hosting and edge runtime**: Cloudflare Pages (including Pages Functions/Workers runtime capability for server routes).
- **Edge key-value store**: Cloudflare KV for session grants, blacklist state, and cache-like policy lookups.
- **Relational persistence**: Cloudflare D1 for reconciliation records and audit-oriented relational queries.

Next.js is explicitly rejected as the primary framework for this system.

## Consequences

**Positive:**

- A single Cloudflare-first deployment path reduces platform variance between environments.
- TanStack Start aligns with the current tech spec direction and keeps the frontend architecture focused on route-first React patterns.
- KV provides fast global reads for session and policy checks, reducing online validation latency.
- D1 provides managed SQL persistence without introducing separate database hosting operations for initial scale.
- Pages + edge runtime simplifies static asset delivery and colocated API endpoints.

**Negative:**

- The stack is more provider-specific; moving off Cloudflare later requires migration work (runtime bindings, KV, and D1 access patterns).
- D1 and KV consistency/transaction semantics are different from traditional centralized SQL deployments; developers must design around those constraints.
- Some Next.js ecosystem tooling and examples are no longer directly reusable.

**Risks:**

- If future requirements demand complex relational workloads or strict multi-row transactional guarantees beyond D1 comfort zones, datastore strategy may need revision.
- Team members familiar with Next.js may face a short-term onboarding cost to TanStack Start conventions.

## Alternatives Considered

| Option                                       | Reason Rejected                                                                                                               |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Next.js + Vercel**                         | Not chosen to avoid split platform assumptions and to stay aligned with the existing TanStack Start-oriented technical specs. |
| **TanStack Start + mixed hosting/providers** | Increases operational variance and weakens reproducibility between environments.                                              |
| **Cloudflare stack with external DB only**   | Adds infrastructure complexity too early for current reconciliation scale and operational goals.                              |
| **Node server on VM/container**              | More operational overhead than a managed edge/serverless deployment model for current requirements.                           |

## References

- System Design [§16 Infrastructure & Stack](../system-design/16_infrastructure-stack.md)
- Tech Specs [§16 Infrastructure Stack](../tech-specs/16_infrastructure-stack.md)
- Tech Specs [§2 System Architecture](../tech-specs/2_system-architecture.md)
- Tech Specs [§8 Backend-Frontend Interfaces](../tech-specs/8_backend-frontend-interfaces.md)
