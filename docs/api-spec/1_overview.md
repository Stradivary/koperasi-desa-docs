# 1. Overview

## Base URL

All endpoints are relative to the backend service root. In production this will be a Cloudflare Worker or compatible edge runtime.

```
https://<deployment-host>/api/
```

## Versioning

The API is currently unversioned. Breaking changes will be introduced via a version prefix (e.g. `/api/v2/`) and announced with a deprecation window. The `keyVersion` field on session grants is independent of API versioning.

## Authentication

All requests require a terminal identity token in the `Authorization` header:

```
Authorization: Bearer <terminal-token>
```

Terminal tokens are issued by the backend during device commissioning (see [§2 Authentication](2_auth.md)). They identify the device, not an individual operator.

Scout (member read-only) requests use a separate member token with a reduced permission scope.

## Common response codes

| Code | Meaning |
|------|---------|
| `200 OK` | Request succeeded; body contains the response |
| `204 No Content` | Request succeeded; no response body |
| `400 Bad Request` | Malformed or invalid request payload |
| `401 Unauthorized` | Missing or invalid `Authorization` header |
| `403 Forbidden` | Valid token but insufficient permissions for this operation |
| `404 Not Found` | Requested resource does not exist |
| `409 Conflict` | State conflict (e.g. duplicate event counter, card already registered) |
| `422 Unprocessable Entity` | Request is well-formed but violates a business rule |
| `500 Internal Server Error` | Backend fault; safe to retry with exponential backoff |

## Common error body

All error responses return a JSON body:

```json
{
  "error": "short_snake_case_code",
  "message": "Human-readable description"
}
```

## Rate limiting

Endpoints that issue key material (`/api/session-grant`, `/api/auth/token`) are rate-limited per terminal identity. Exceeding the limit returns `429 Too Many Requests` with a `Retry-After` header.

## Offline behaviour

Terminals must tolerate backend unavailability. Only the following operations require connectivity:
- Fetching a session grant or policy refresh
- Submitting a reconciliation batch
- Any card management operation (registration, top-up, block, reissue)

See [Tech Specs §8](../tech-specs/8_backend-frontend-interfaces.md) for terminal offline behaviour rules.
