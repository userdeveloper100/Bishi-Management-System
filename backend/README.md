# Bishi Management System — Backend

REST API for the Bishi (chit fund) management system. The backend is built with Node.js, Express, TypeScript, Prisma, and PostgreSQL.

## Scope

The backend covers the data model, authentication, and CRUD APIs that the frontend needs to manage groups, bishis, memberships, transactions, messages, and notifications, with an audit trail.

Out of scope for now (see [Not implemented yet](#not-implemented-yet)): payment processing, bishi draw and winner selection, and multi-language support.

## Status

### Done

- Prisma data models for users, roles, permissions, groups, Bishis, transactions, memberships, messages, notifications, and audit logs.
- CRUD API routes for users, groups, Bishis, transactions, memberships, messages, notifications, and audit logs.
- User registration and login with bcrypt password hashing and JWT tokens.
- Authentication middleware and role checks: `admin` role required for user-management routes and for deletes on other resources.
- Seed script that creates the `admin` and `user` roles and their initial permissions.
- Membership creation with `userId` and `groupId` validation.
- Token authentication on every resource route, with consistent `{ success, message }` error responses.
- Input validation on create and update, with whitelisted update fields.
- Hashed passwords for users created or updated through the API, and password hashes removed from user responses.
- Swagger UI at `/api-docs` and a root health-check endpoint.
- End-to-end API test suite in `tests/e2e/` (`npm run test:e2e`) covering all 42 API endpoints, including auth, role checks, validation, and unknown-ID handling.

### In progress

- Nothing is in progress on the backend at the moment.

### Pending

- Automatic audit logging of changes to entities other than the audit log itself.
- Field-level validation tests for each resource, beyond the empty-body and missing-field cases.
- Payment integration.
- Bishi draw and winner-selection workflows.
- Multi-language support.

## Plan

There is no separate PRD or epic list in this repository yet. The phases below are derived from the features implemented so far and the pending items above, so treat the order as a proposal.

| Phase | Goal | Status |
| --- | --- | --- |
| 1. Foundation | Data models, auth, CRUD APIs, validation, seed data, API tests | Done |
| 2. Hardening | Audit logging for all entities, field-level validation tests | Pending |
| 3. Business workflows | Bishi draw and winner selection, payment integration | Pending |
| 4. Localization and release | Multi-language support, deployment configuration | Pending |

## Not implemented yet

- Multi-language support.
- Payment integration.
- Bishi draw and winner-selection workflows.
- Automatic audit logging of changes to other entities.
- Field-level validation tests for each resource beyond the empty-body and missing-field cases.

## Tech stack

- Node.js and Express 5
- TypeScript
- PostgreSQL with Prisma ORM
- JWT (`jsonwebtoken`) and bcrypt
- Swagger UI (`swagger-jsdoc`, `swagger-ui-express`)

## Project structure

```text
backend/
├── prisma/
│   ├── schema.prisma       # Database models
│   └── seed.ts             # Initial roles and permissions
├── src/
│   ├── config/             # Swagger configuration
│   ├── controllers/        # HTTP request handlers
│   ├── middlewares/        # Authentication and authorization
│   ├── routes/             # API route definitions
│   ├── services/           # Business and database operations
│   ├── utils/              # Shared utilities
│   ├── app.ts              # Express app, middleware, and routes
│   ├── prismaClient.ts     # Prisma client
│   └── server.ts           # Server startup
├── tests/
│   └── e2e/                # End-to-end API tests
├── package.json
└── README.md
```

## Getting started

### Requirements

- Node.js and npm
- PostgreSQL

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the `backend/` folder:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/bishi_db?schema=public"
PORT=5000
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=1d
BCRYPT_SALT_ROUNDS=10
```

`DATABASE_URL` must point to your PostgreSQL database. `PORT` defaults to `5000`, `JWT_EXPIRES_IN` defaults to `1d`, and `BCRYPT_SALT_ROUNDS` defaults to `10`. Do not commit `.env`; it is git-ignored.

### 3. Generate Prisma Client and apply migrations

```bash
npm run prisma:generate
npx prisma migrate dev --name init
```

Use an appropriate migration name if the database already has migration history.

### 4. Seed initial roles and permissions

```bash
npx ts-node prisma/seed.ts
```

Run the seed before registering users: registration assigns the default `user` role, which must already exist.

### 5. Start the server

```bash
npm run dev
```

The API listens on `http://localhost:5000` by default (or the configured `PORT`). For a compiled production build:

```bash
npm run build
npm start
```

## API

All API routes use the `/api` prefix.

| Resource | Base route | Available operations |
| --- | --- | --- |
| Authentication | `/api/auth` | `POST /register`, `POST /login` |
| Users | `/api/users` | `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id` |
| Groups | `/api/groups` | CRUD |
| Bishis | `/api/bishis` | CRUD |
| Transactions | `/api/transactions` | CRUD |
| Memberships | `/api/memberships` | CRUD |
| Messages | `/api/messages` | CRUD |
| Notifications | `/api/notifications` | CRUD |
| Audit logs | `/api/audits` | CRUD |

CRUD routes provide `GET /`, `GET /:id`, `POST /`, `PUT /:id`, and `DELETE /:id` under the resource's base route. Interactive API documentation is available at `http://localhost:5000/api-docs`. The health check is available at `GET /`.

### Authentication

Register at `POST /api/auth/register` with `name`, `email`, and `password`. Log in at `POST /api/auth/login` with `email` and `password`; a successful login returns a JWT and user details. Send the token to protected endpoints in the `Authorization` header:

```http
Authorization: Bearer <token>
```

The user-list route requires authentication. User read-by-ID, create, update, and delete routes additionally require the `admin` role. Groups, bishis, transactions, messages, memberships, notifications, and audits require a valid token for every operation. Deletes on those resources also require the `admin` role.

Errors return `{ "success": false, "message": "..." }`. Validation failures return 400, unknown IDs return 404, and duplicate values return 409.

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run the development server with automatic restart |
| `npm run build` | Compile TypeScript into `dist/` |
| `npm start` | Run the compiled server |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:migrate` | Run Prisma migrations |
| `npx prisma studio` | Open Prisma Studio |
| `npx ts-node prisma/seed.ts` | Create initial roles and permissions |
| `npm run test:e2e` | Run the end-to-end API test suite |

## Testing

The end-to-end suite lives in `tests/e2e/`, separate from the application source. It uses Node's built-in test runner, so it needs no extra dependencies.

```bash
npm run test:e2e
```

The suite starts the backend on port `5055` (set `TEST_PORT` to change it) and runs the endpoint checks against the database in `.env`. It creates and deletes its own records, but it still writes to that database. To use a separate database, set `TEST_DATABASE_URL`. To run against a server you already started, set `API_BASE_URL`. The admin login defaults to the seeded account; override it with `E2E_ADMIN_EMAIL` and `E2E_ADMIN_PASSWORD`.

## Author

**Shailendra Pardeshi**
Senior Full Stack Developer
[LinkedIn](https://www.linkedin.com/in/shailendra-pardeshi-031596192) · shailendrapardeshi123@gmail.com
