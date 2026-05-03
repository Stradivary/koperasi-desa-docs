# 1. Core Objective

Design an **offline-capable NFC wallet system** that:

- Stores **balance, session state, and logs directly on the card**
- Detects **tampering, cloning, replay, and rollback**
- Works with **Web NFC and Web Crypto** without requiring a native app
- Supports **multi-frontend experiences** with a shared backend
- Enforces **bounded financial risk** (maximum Rp 16M, recommended Rp 2M)

## Goals

- Enable secure offline transactions with a disposable trust model.
- Keep the card data tamper-evident rather than fully tamper-proof.
- Provide a recoverable backend audit trail for reconciliation.
- Maintain compatibility with NTAG215/216 NFC cards.

## Design priorities

- Security first for state integrity, even with untrusted card storage.
- Minimal card-side logic; the card holds state while terminals enforce rules.
- Ease of extension through modular design sections.
