# Async CSV Parser API

## Base URL

- Local: http://localhost:3000

## Conventions

- All requests and responses use JSON unless noted.
- Dates are returned as ISO 8601 strings.

---

## Health

### GET /

Returns a simple status message.

**Response 200**

```json
"Server is running!"
```

---

## Import Jobs

### POST /api/import

Upload a CSV file and enqueue an import job.

**Request**

- Content-Type: multipart/form-data
- Form field: `file` (CSV file)

**Example request (curl)**

```bash
curl -X POST http://localhost:3000/api/import \
  -F "file=@test.csv"
```

**Response 202**

```json
{
  "message": "File uploaded and job added to queue",
  "jobId": "64a0c1a7b0f2e5a4e3f90a12"
}
```

**Error 400 (no file)**

```json
{
  "error": "No file uploaded"
}
```

---

### GET /api/import/:id

Fetch import job status and details.

**Path params**

- `id` (string): Import job ObjectId

**Example request**

```bash
curl http://localhost:3000/api/import/64a0c1a7b0f2e5a4e3f90a12
```

**Response 200**

```json
{
  "_id": "64a0c1a7b0f2e5a4e3f90a12",
  "status": "completed",
  "totalRecords": 3,
  "successCount": 2,
  "failedCount": 1,
  "rejectedRecords": [
    {
      "row": 2,
      "data": {
        "full_name": "Bob Broken",
        "email": "bobbad@",
        "date_of_birth": "2030-05-01",
        "timezone": "Invalid/Zone"
      },
      "errors": [
        "email is invalid.",
        "date_of_birth must be in the past.",
        "timezone is invalid."
      ]
    }
  ],
  "createdAt": "2026-02-17T05:10:20.123Z",
  "updatedAt": "2026-02-17T05:10:25.456Z"
}
```

**Error 400 (invalid id)**

```json
{
  "error": "Invalid job ID"
}
```

**Error 404 (not found)**

```json
{
  "error": "Import job not found"
}
```

**Error 500**

```json
{
  "error": "Failed to fetch import job"
}
```

---

## Customers

### GET /api/customers

List customers with pagination.

**Query params**

- `page` (number, optional, default: 1)
- `limit` (number, optional, default: 10)

**Example request**

```bash
curl "http://localhost:3000/api/customers?page=1&limit=2"
```

**Response 200**

```json
{
  "data": [
    {
      "_id": "64a0c1b5b0f2e5a4e3f90a34",
      "full_name": "Alice Smith",
      "email": "alice@example.com",
      "date_of_birth": "1990-01-01T00:00:00.000Z",
      "timezone": "UTC",
      "createdAt": "2026-02-17T05:12:10.000Z",
      "updatedAt": "2026-02-17T05:12:10.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 2
}
```

**Error 500**

```json
{
  "error": "Failed to fetch customers"
}
```

---

### GET /api/customers/:id

Fetch a customer by id.

**Path params**

- `id` (string): Customer ObjectId

**Example request**

```bash
curl http://localhost:3000/api/customers/64a0c1b5b0f2e5a4e3f90a34
```

**Response 200**

```json
{
  "_id": "64a0c1b5b0f2e5a4e3f90a34",
  "full_name": "Alice Smith",
  "email": "alice@example.com",
  "date_of_birth": "1990-01-01T00:00:00.000Z",
  "timezone": "UTC",
  "createdAt": "2026-02-17T05:12:10.000Z",
  "updatedAt": "2026-02-17T05:12:10.000Z"
}
```

**Error 400 (invalid id)**

```json
{
  "error": "Invalid customer ID"
}
```

**Error 404**

```json
{
  "error": "Customer not found"
}
```

**Error 500**

```json
{
  "error": "Failed to fetch customer"
}
```

---

### PATCH /api/customers/:id

Update one or more customer fields.

**Path params**

- `id` (string): Customer ObjectId

**Request body**

Any subset of:

- `full_name` (string)
- `email` (string)
- `date_of_birth` (string, ISO 8601 date)
- `timezone` (string, IANA time zone)

**Example request**

```bash
curl -X PATCH http://localhost:3000/api/customers/64a0c1b5b0f2e5a4e3f90a34 \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Alice Updated","email":"alice.updated@example.com"}'
```

**Response 200**

```json
{
  "_id": "64a0c1b5b0f2e5a4e3f90a34",
  "full_name": "Alice Updated",
  "email": "alice.updated@example.com",
  "date_of_birth": "1990-01-01T00:00:00.000Z",
  "timezone": "UTC",
  "createdAt": "2026-02-17T05:12:10.000Z",
  "updatedAt": "2026-02-17T05:14:20.000Z"
}
```

**Error 400 (invalid id)**

```json
{
  "error": "Invalid customer ID"
}
```

**Error 400 (validation)**

```json
{
  "errors": [
    "email is invalid.",
    "date_of_birth is invalid format."
  ]
}
```

**Error 404**

```json
{
  "error": "Not found"
}
```

**Error 500**

```json
{
  "error": "<error message>"
}
```

---

### DELETE /api/customers/:id

Delete a customer by id.

**Path params**

- `id` (string): Customer ObjectId

**Example request**

```bash
curl -X DELETE http://localhost:3000/api/customers/64a0c1b5b0f2e5a4e3f90a34
```

**Response 200**

```json
{
  "message": "Deleted successfully"
}
```

**Error 400 (invalid id)**

```json
{
  "error": "Invalid customer ID"
}
```

**Error 404**

```json
{
  "error": "Not found"
}
```

**Error 500**

```json
{
  "error": "<error message>"
}
```
