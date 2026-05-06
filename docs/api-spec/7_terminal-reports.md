# 7. Terminal Reports

Terminals report tamper events, suspicious card states, and operational errors to the backend in real time when connectivity is available. If offline, reports must be queued and sent when connectivity resumes — before the next session grant request.

---

## `POST /api/terminal-report`

Report a tamper event, suspicious card state, or terminal error to the backend.

**Request headers**: `Authorization: Bearer <terminal-token>`

**Request body**:
```json
{
  "terminalId": 42,
  "cardId": "<6-byte hex or null>",
  "eventType": "tamper",
  "details": "HMAC mismatch on read",
  "counter": 17,
  "timestamp": 1746692000
}
```

| Field | Type | Description |
|-------|------|-------------|
| `terminalId` | uint16 | Reporting terminal identifier |
| `cardId` | hex string \| null | Card involved; `null` for terminal-level errors |
| `eventType` | string | See event type vocabulary below |
| `details` | string | Human-readable description of the event (max 256 chars) |
| `counter` | uint64 \| null | Card write counter at the time of the event; `null` if unavailable |
| `timestamp` | uint32 | UTC seconds when the event occurred |

**Event type vocabulary**:

| Value | Meaning |
|-------|---------|
| `tamper` | Cryptographic or chain integrity check failed |
| `replay` | Counter rollback or clone detected |
| `invalid_transition` | Card state transition not permitted by the state machine |
| `session_expired` | Session grant was expired at time of operation |
| `write_failure` | Card write could not be verified after commit |
| `terminal_error` | Internal terminal fault (not card-related) |

**Response** (`204 No Content`).

**Error responses**:

| Code | Error | Cause |
|------|-------|-------|
| `400 Bad Request` | `malformed_payload` | Missing required fields |
| `401 Unauthorized` | `invalid_token` | Bearer token missing or invalid |

## Backend actions on receipt

| Event type | Backend action |
|-----------|---------------|
| `tamper` | Set card status to `BLOCKED_TAMPER` in backend record; alert reconciliation operator |
| `replay` | Set card status to `BLOCKED_FRAUD`; flag all recent events from this card for review |
| `invalid_transition` | Log for review; no automatic status change |
| `session_expired` | Log only |
| `write_failure` | Log; flag card for next-tap validation |
| `terminal_error` | Log only |

## Queuing behaviour

If the terminal is offline when a report event occurs:
1. The event is queued locally (in memory or ephemeral storage).
2. The queue is flushed to `/api/terminal-report` before the next `GET /api/session-grant` call.
3. If the queue cannot be flushed after 3 attempts, the terminal must require operator acknowledgement before resuming card operations.
