# 1. Overview

This document defines the technical implementation details for the offline NFC wallet system.

The system enables a **Web NFC-based wallet** that stores balance, session state, and transaction logs on an NTAG215/216 NFC card. All security-critical state lives on the card itself, allowing the frontend to validate and operate fully offline while the backend provides session grants, policy, and reconciliation when connectivity is available.

## Key qualities

- **Offline-first card operations**: The terminal can complete read and write transactions without backend access. The card carries all the state needed for local validation.
- **Multi-frontend support**: A single backend service is shared between station, gate, terminal, and member-view frontends.
- **Tamper-evident on-card state**: Cryptographic binding of balance, counter, logs, and metadata means any unauthorized modification is detectable on read.
- **Bounded financial risk**: Hard balance caps and per-transaction limits reduce exposure from lost, cloned, or compromised cards.
- **Atomic writes**: The A/B buffer strategy ensures the card is never left in a partially written state.

## System boundary

This spec covers:

- NFC card layout, cryptographic model, and validation logic.
- Frontend browser app built with TanStack Start and Web NFC / Web Crypto APIs.
- Backend Nitro service for session grants, policy, and reconciliation.
- Terminal workflows and offline operational rules.

Out of scope:

- Physical card manufacturing, printing, or personalization.
- Payment network settlement or third-party tokenization.
- Government ID integration or biometric binding.

## Document map

| Section | Topic                                                   |
| ------- | ------------------------------------------------------- |
| 2       | System architecture and actor roles                     |
| 3       | Card binary layout and field definitions                |
| 4       | Cryptographic algorithms and key derivation             |
| 5       | Tamper detection conditions and validation flow         |
| 6       | Card state machine and session lifecycle                |
| 7       | A/B buffer write strategy and failure recovery          |
| 8       | Backend and frontend interface contracts                |
| 9       | Financial limits and risk controls                      |
| 10      | Implementation notes and platform guidance              |
| 11      | Deployment, maintenance, and card lifecycle             |
| 12      | Key hierarchy and session grant structure               |
| 13      | Role-specific app models and permission boundaries      |
| 14      | Transaction log format and chain integrity              |
| 15      | Status codes and block/unblock rules                    |
| 16      | Infrastructure stack and deployment pattern             |
| 17      | Time handling, validation assumptions, and scope limits |
