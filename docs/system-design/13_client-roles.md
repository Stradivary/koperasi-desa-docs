# 13. Client Roles & Apps

## Roles

- **Station**: card registration, top-up, issuance, blacklist management.
- **Gate**: session start/end, check-in/out, validation enforcement.
- **Terminal**: transaction execution, offline validation, card update.
- **Scout**: member-facing app for read-only balance and log review.

## Responsibilities

- Station registers new cards, loads value, and enforces administrative controls.
- Gate handles entry/exit workflows and session lifecycle.
- Terminal performs wallet operations, writes secure updates, and reports suspicious events.
- Scout provides member status and transaction history without allowing balance changes.

## Simulation mode

- Gate-only simulation is supported for offline testing and validation.
- In simulation mode, the terminal can verify card flows without committing value changes.
