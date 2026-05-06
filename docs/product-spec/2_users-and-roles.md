# 2. Users & Roles

## Role table

| Role | Description | Trust Level | App |
|------|-------------|-------------|-----|
| **Member** | Cardholder. Uses an NFC card as a prepaid wallet. May check their own balance and history. Cannot modify card state directly. | Untrusted — card contents are unverified until cryptographically validated | Scout (read-only) |
| **Terminal operator** | Staff at a point-of-sale or service point. Executes debits, check-ins, and check-outs. Operates primarily offline. | Conditionally trusted — terminal acts within the scope of a backend-issued session grant | Terminal app |
| **Gate operator** | Staff managing entry/exit points. Validates card status and session lifecycle (CHECKED_IN / CHECKED_OUT). | Conditionally trusted — same session grant model as terminal | Gate app |
| **Station operator** | Administrative staff. Registers new cards, tops up balances, issues and blocks cards. Always requires backend connectivity. | Trusted — all station operations are online and backend-validated | Station app |
| **Backend operator / reconciler** | Internal staff who review reconciliation reports, resolve disputes, and manage risk flags. No direct card interaction. | Trusted — operates on backend data only | Backend admin UI |
| **System (backend)** | Issues session grants, validates reconciliation batches, enforces financial limits, maintains the audit log. | Authoritative — the root of trust for all policy and key material | Nitro backend service |

## Role constraints

- A **member** may never write to their own card — all writes are performed by operator-role apps.
- A **terminal operator** may only execute operations permitted by the current session grant. The session grant is issued per terminal, not per operator.
- A **station operator** must be online to issue a session grant; no offline top-ups are permitted.
- The **backend** is the only entity that issues or rotates key material. Terminals never generate keys.

## Role interactions

```
Member card
    │
    ├─── read ──────────────► Scout app (member view, read-only)
    │
    ├─── read + write ──────► Terminal app (within session grant)
    │
    ├─── read + write ──────► Gate app (check-in / check-out)
    │
    └─── register + top-up ► Station app (online only)
                                    │
                                    └─── reconcile + audit ► Backend
```

> See [System Design §13 Client Roles](../system-design/13_client-roles.md) for the technical breakdown of each app's card access permissions.
