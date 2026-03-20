# API Response Structure

> How we formulate and encapsulate data sent back to clients.

## High-Level Policy

All JSON API endpoints **MUST** return a structured response payload using the unified wrapper `App\Helpers\ApiResponse`.
Do NOT use `response()->json()` manually unless you are returning strict standardized formats (like GeoJSON for Mapbox plugins).

### Envelope Structure
Every response follows this primary envelope design:
```json
{
  "success": true,
  "message": "Human readable action result status",
  "data": { ... } // Or an array
}
```

### Paginator Structure
Pagination adds extra `meta` and `links` objects:
```json
{
  "success": true,
  "message": "List retrieved",
  "data": [ ... ],
  "meta": {
      "current_page": 1,
      "last_page": 5,
      "per_page": 15,
      "total": 75,
      "from": 1,
      "to": 15
  },
  "links": {
      "first": "...",
      "last": "...",
      "prev": null,
      "next": "..."
  }
}
```

### Valid ApiResponse Helper Methods:
In Laravel, inject `use App\Helpers\ApiResponse;` at the top of your controller:

- `ApiResponse::success($data, $message, $status)` -> standard 200 OK
- `ApiResponse::created($data, $message)` -> 201 Created
- `ApiResponse::paginate($paginator, $message)` -> automatic meta/links pagination
- `ApiResponse::deleted($message)` -> 200 OK without payload
- `ApiResponse::error($message, $status, $errors)` -> Generic errors
- `ApiResponse::notFound($message)` -> 404
- `ApiResponse::unauthorized($message)` -> 401
- `ApiResponse::forbidden($message)` -> 403
- `ApiResponse::validationError($errors, $message)` -> 422 with precise validation bags
- `ApiResponse::serverError($message)` -> 500
