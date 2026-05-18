# 7. Terminal Reports

Terminals send reports for tamper events, suspicious card states, or terminal errors.

## `POST /api/terminal-report`

**Request**:

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

Common event types:

- `tamper`
- `replay`
- `invalid_transition`
- `session_expired`
- `write_failure`
- `terminal_error`

Errors:

- `400 malformed_payload`
- `401 invalid_token`

## Notes

- Reports may be queued when offline and sent when connectivity returns.
- The backend may mark cards blocked or flag them for review based on report type.
