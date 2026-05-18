# 3. Security Model

## Threat model

The card is treated as an untrusted storage medium in the hands of a potentially adversarial actor. We assume an attacker can:

| Threat                          | Description                                                                |
| ------------------------------- | -------------------------------------------------------------------------- |
| **Full card read**              | Read every byte of card contents with any standard NFC reader              |
| **Card cloning**                | Copy a valid card byte-for-byte onto a blank NTAG215/216                   |
| **Arbitrary byte modification** | Write any bytes to the card with an NFC writer                             |
| **State replay**                | Re-present a valid older card image after newer transactions have occurred |
| **Counter/timestamp rollback**  | Overwrite the monotonic counter or timestamp with a lower value            |
| **Invalid state transition**    | Attempt a checkout from IDLE, or a debit while CHECKED_OUT                 |

## Defence strategy

Each defence is paired with the threat it closes.

| Defence                            | What it does                                                                                                                                                                                                 | Threats closed                                          |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| **AES-GCM encryption**             | Encrypts the full payload buffer before writing to the card. The GCM authentication tag detects any modification to the ciphertext, even if the attacker has no key.                                         | Arbitrary byte modification, partial tampering          |
| **HMAC-SHA256 over trailer**       | Covers the trailer fields (including `rootHash`, `counter`, `activePtr`, `keyVersion`) separately from the AES-GCM payload. Prevents an attacker from swapping a legitimate trailer onto a modified payload. | Trailer substitution, selective field modification      |
| **Hash chain log**                 | Each log entry's hash is computed over its own data plus the previous entry's hash, anchored at session start. Any modification to any log entry breaks the chain from that point forward.                   | Log entry modification, insertion, deletion, reordering |
| **Monotonic write counter**        | The `counter` field is a `uint64` that increments on every write and is never decremented. Any read that shows a lower counter than the terminal's last known value is rejected as a rollback.               | State replay, counter rollback                          |
| **Session expiry**                 | Session grants and card payloads carry an `expiresAt` timestamp. Operations after expiry are rejected, bounding the useful window of any captured or cloned state.                                           | Long-term replay, stale clone attacks                   |
| **Per-card key derivation (HKDF)** | Per-card encryption and HMAC keys are derived from the session key + card ID. A key compromise for one card does not expose any other card.                                                                  | Bulk key compromise, cross-card key reuse               |
| **Status flags**                   | When any tamper condition is detected, the card is escalated to a `BLOCKED_*` status on the next authenticated write. Blocked cards are read-only and cannot accept value changes.                           | Continued exploitation of a compromised card            |

## Security goals

- Detect unauthorised changes on every read, with no trusted state from previous reads.
- Ensure any modification outside a legitimate write path results in a detectable validation failure.
- Minimise offline trust by verifying decisions against backend policies whenever connectivity is available.
- Bound the worst-case damage from a lost, stolen, or cloned card to the session grant scope.
