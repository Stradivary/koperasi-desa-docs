# 13. Client Roles & Apps

## Roles

- **Tenant admin**: manages a single koperasi tenant, including operator accounts, device enrollment, and tenant policy.
- **Station**: card registration, top-up, issuance, blacklist management.
- **Gate**: session start/end, check-in/out, validation enforcement.
- **Terminal**: transaction execution, offline validation, card update.
- **Scout**: member-facing app for read-only balance and log review.

All interactive roles run inside an explicit tenant context. A valid operating session requires both an authenticated user session and an enrolled device identity.

## Responsibilities

- Tenant admin invites operators, assigns tenant-scoped roles, and rotates compromised device credentials.
- Station registers new cards, loads value, and enforces administrative controls.
- Gate handles entry/exit workflows and session lifecycle.
- Terminal performs wallet operations, writes secure updates, and reports suspicious events.
- Scout provides member status and transaction history without allowing balance changes.

## Session model

- Devices authenticate with an enrolled key pair or commissioning secret and obtain a device assertion.
- Human operators authenticate with password plus a second factor when online.
- The backend issues a short-lived access token and a refresh token bound to `tenantId`, `accountId`, `deviceId`, and allowed roles.
- Offline operation is allowed only while a previously issued tenant-scoped session grant and cached operator session are both valid.
- Any tenant switch invalidates cached write authority from the previous tenant.

## Simulation mode

- Gate-only simulation is supported for offline testing and validation.
- In simulation mode, the terminal can verify card flows without committing value changes.
