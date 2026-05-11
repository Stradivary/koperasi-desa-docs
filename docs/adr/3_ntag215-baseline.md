# ADR-003: NTAG215 as the Production Card Baseline

**Date**: 2025-01-01  
**Status**: Accepted

## Context

The system requires a physical NFC card that members carry. The card must:

1. Hold an encrypted wallet payload (balance, identity, session state, transaction log).
2. Be readable and writable by Android Chrome via the Web NFC API (NFC Forum Type 2 tag).
3. Be affordable enough for mass distribution to venue members.
4. Be self-sourceable without vendor lock-in or minimum order quantities that block a small-scale deployment.

Multiple NXP NTAG variants exist in the Type 2 family: NTAG213 (144 bytes), NTAG215 (504 bytes, ~492 usable), and NTAG216 (888 bytes, ~872 usable). The card must hold the full encrypted payload including two mirrored buffers (A/B strategy), a transaction log, and a trailer. Byte budget is a hard constraint.

## Decision

**NTAG215** is the production card baseline.

- NTAG215 provides ~492 bytes of usable NFC memory, which is sufficient to hold:
  - Zone A (active buffer): ~112 bytes
  - Zone B (shadow buffer): ~112 bytes
  - Log zone (7 entries × 16 bytes): 112 bytes
  - Trailer/meta: 64 bytes
  - Identity and session blocks: ~80 bytes
- NTAG215 cards are self-purchaseable in small quantities from standard electronics distributors (e.g., AliExpress, Alibaba) without vendor agreements.
- NTAG215 complies with ISO 14443-3A and NFC Forum Type 2, which is required for Web NFC write access.
- Per-card cost at retail quantities is ≤ Rp 5,000 (approximately USD 0.30), which is acceptable for a venue-scale deployment.

**NTAG216** is retained as the development and testing baseline:
- Provides ~872 bytes, which accommodates extended transaction logs (up to 25+ entries), larger payloads, and developer experimentation.
- Not deployed to members; used only in development and QA environments.

## Consequences

**Positive:**
- No vendor lock-in; cards are commodity hardware available globally.
- Low per-unit cost supports large-scale member distribution.
- ISO 14443-3A compliance ensures compatibility with the Web NFC API on Android Chrome.
- Sufficient capacity for the full system payload including 7-entry log and A/B buffers.

**Negative:**
- 492 bytes is tight. Future payload extensions (additional metadata, longer logs) will require schema discipline or a card upgrade.
- NTAG215 has no secure element and no hardware-enforced access control. Full attacker read and write access must be assumed; all security must be achieved through software cryptography.
- The 7-entry transaction log limit (imposed by NTAG215 capacity) means reconciliation must occur frequently to avoid losing log history.

**Risks:**
- If the byte budget is exceeded by future feature additions, a hardware card swap is required (NTAG215 → NTAG216). Existing member cards cannot be upgraded in place; a re-issuance campaign would be needed.
- Supply chain disruption for NTAG215 chips would require re-qualifying NTAG216 or another Type 2 card. The schema is designed to be card-type-agnostic; capacity limits are the only variable.

## Alternatives Considered

| Option | Reason Rejected |
|--------|-----------------|
| **NTAG213 (144 bytes)** | Insufficient capacity for the full payload with A/B buffers and a log. Cannot hold the minimum viable card state. |
| **NTAG216 (production)** | Per-unit cost is higher; overkill for production use given the current payload fits in NTAG215. Reserved for development. |
| **Cards with secure element (e.g., MIFARE DESFire)** | Significantly higher cost (10–50× per card). Requires vendor-specific SDKs and provisioning infrastructure. Not compatible with Web NFC API without a native bridge. Introduces vendor lock-in. |
| **QR code / barcode instead of NFC** | Cannot hold mutable state; requires backend round-trip on every scan; no offline capability. Fundamentally incompatible with the offline-first design requirement. |

## References

- System Design [§2 Hardware Constraints](../system-design/2_hardware-constraints.md)
- Product Spec [§3 Constraints](../product-spec/3_constraints.md)
- Tech Specs [§3 Card Storage Model](../tech-specs/3_card-storage-model.md)
