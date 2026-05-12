# 1. Overview

## Base URL

All endpoints are relative to the backend service root.

```
https://<deployment-host>/api/
```

## Versioning

The API is currently unversioned. Breaking changes will use a version prefix (e.g. `/api/v2/`) and a deprecation window.

## Authentication

Authenticated requests use a bearer token:

```
Authorization: Bearer <access-token>
```

Access tokens identify the active tenant, operator role, and device context.

## Common response codes

| Code | Meaning |
|------|---------|
| `200` | OK |
| `204` | No Content |
| `400` | Bad Request |
| `401` | Unauthorized |
| `403` | Forbidden |
| `404` | Not Found |
| `409` | Conflict |
| `422` | Unprocessable Entity |
| `429` | Too Many Requests |
| `500` | Internal Server Error |

All error responses return:

```json
{
  "error": "short_snake_case_code",
  "message": "Human-readable description"
}
```

## Offline behaviour

Terminals should continue working when the backend is unavailable. The backend is required only for:
- session grants and policy refresh
- reconciliation uploads
- card registration, top-up, block, and reissue

See [Tech Specs §8](../tech-specs/8_backend-frontend-interfaces.md) for offline terminal behaviour.
