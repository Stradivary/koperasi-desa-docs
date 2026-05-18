# ADR-012: Cloudflare as Distribution/CDN with Local-First Offline Operation

**Date**: 2026-05-12  
**Status**: Accepted

## Context

The project uses Cloudflare for asset delivery and has considered Cloudflare Pages Functions / Workers for backend APIs. The system should leverage Cloudflare strengths without making it the only path for core terminal operation.

The prior ADR-007 chose Cloudflare as the application platform, but the local-first model requires that Cloudflare be treated primarily as a distribution and optional sync provider rather than a mandatory execution host for transactions.

## Decision

Standardize Cloudflare as the primary static distribution platform and optionally as an edge-friendly sync host:

- Use **Cloudflare Pages** to serve static frontend assets and terminal UI.
- Treat backend execution on **Cloudflare Pages Functions / Workers** as optional for session grants, reconciliation upload, and policy refresh.
- Do not require Cloudflare backend availability for active terminal transactions when a valid cached local grant exists.
- Allow alternative hosting or local-first deployment models for environments where Cloudflare is not the primary runtime.

## Consequences

**Positive:**

- Cloudflare provides fast, globally distributed static asset delivery.
- The terminal remains usable even if Cloudflare APIs are temporarily unreachable.
- The architecture is less tied to a single provider for core transaction functionality.
- Deployment remains simple while still allowing optional remote sync.

**Negative:**

- Some Cloudflare-specific backend optimizations may be underutilized.
- The system still needs to support local persistence and offline trust policies outside the remote platform.

**Risks:**

- If Cloudflare is the only distribution path, deployments may still face provider availability issues; however, the end-user transaction model does not depend on it.
- Optional remote sync must be clearly separated from the local terminal execution path in implementation.

## Alternatives Considered

| Option                                                          | Reason Rejected                                                          |
| --------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Treat Cloudflare as required runtime for all terminal logic** | Violates local-first and offline resiliency goals.                       |
| **Use Cloudflare for distribution only, no backend APIs**       | Removes useful optional sync capabilities for policy and reconciliation. |
| **Use mixed provider hosting for backend APIs**                 | Increases operational variance and reduces predictability.               |

## References

- Tech Specs [§10 Implementation Notes](../tech-specs/10_implementation-notes.md)
- Tech Specs [§16 Infrastructure Stack](../tech-specs/16_infrastructure-stack.md)
- ADR-007 [TanStack Start and Cloudflare Pages/KV/D1 as the Application Platform](7_tanstack-start-cloudflare-stack.md)
