# Async CSV Parser

## Quick Start

```bash
docker-compose up
```

The app will be available at http://localhost:3000.

## Prerequisites

- Docker
- Docker Compose

## API Usage Examples

### GET /

```bash
curl http://localhost:3000/
```

### POST /api/import

```bash
curl -X POST http://localhost:3000/api/import \
  -F "file=@test.csv"
```

### GET /api/import/:id

```bash
curl http://localhost:3000/api/import/64a0c1a7b0f2e5a4e3f90a12
```

### GET /api/customers

```bash
curl "http://localhost:3000/api/customers?page=1&limit=2"
```

### GET /api/customers/:id

```bash
curl http://localhost:3000/api/customers/64a0c1b5b0f2e5a4e3f90a34
```

### PATCH /api/customers/:id

```bash
curl -X PATCH http://localhost:3000/api/customers/64a0c1b5b0f2e5a4e3f90a34 \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Alice Updated","email":"alice.updated@example.com"}'
```

### DELETE /api/customers/:id

```bash
curl -X DELETE http://localhost:3000/api/customers/64a0c1b5b0f2e5a4e3f90a34
```

For detailed request/response formats and error examples, see docs/api.md.

## Testing

Unit tests:

Integration tests (requires Docker services running):

```bash
docker-compose up -d mongo redis worker
npm run test:integration
```

Coverage:

```bash
npm test -- --coverage
```

## Project Structure

- src/index.js: Server entrypoint
- src/app.js: Express app setup
- src/routes/: HTTP routes
- src/models/: Mongoose schemas
- src/workers/: Queue worker
- src/queues/: BullMQ queue setup
- src/utils/: Validation helpers
- uploads/: Uploaded CSV files
- docs/api.md: API documentation

## Architecture

```
- - Client
- -   |
- -   | POST /api/import (multipart CSV)
- -   v
- - Express API
- -   |
- -   -- Customer CRUD -> MongoDB (synchronous)
- -   |
- -   -- CSV Upload
- -         |
- -         v
- -       BullMQ Queue (Redis)
- -         |
- -         v
- -     Worker Process
- -         |
- -         v
- -   Stream CSV -> Validate -> Batch Insert -> Update Job Stat


- +   | Save file to disk
- +   | Create ImportJob document (MongoDB)
- +   | Enqueue job in Redis (BullMQ)
- +   v
- + Redis Job Queue
- +   |
- +   v
- + Worker Process
- +   |
- +   | Stream CSV file (row-by-row)
- +   | Validate each row
- +   | Buffer valid rows into batches (size N)
- +   | Bulk insert using insertMany()
- +   | Track rejected records
- +   | Update ImportJob status
- +   v
- + MongoDB
- +   |-- Customers Collection
- +   `-- ImportJobs Collection
```

## Design Decisions

- Express for a minimal HTTP layer.
- Mongoose for schema validation and MongoDB access.
- CSV imports are handled asynchronously using BullMQ and Redis to prevent large file processing from blocking API requests.
When a user uploads a CSV file, the API enqueues an import job and returns immediately with a job ID
- Multer for handling the csv file before passing into the file into queue
- Worker process separated from the API to keep imports off the request path and prevent blocking the main server
- Standard customer CRUD operations are processed synchronously

## Assumptions & Limitations

- Worker and API must share the same uploads volume when using Docker.
- CSV rows are processed sequentially; very large files may be slow.
- No authentication or rate limiting is included.
- The API assumes a running MongoDB and Redis instance.

## Future Improvements

- Add OpenAPI/Swagger docs generated from route definitions.
- Add auth and request rate limiting.
- Add structured logging and metrics.
- Add retry and dead-letter handling for failed jobs.
