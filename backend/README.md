# BhishiPay Backend

REST API for BhishiPay, a savings and bidding app for Bhishi (chit fund) circles. Members join groups, make monthly contributions, and bid for payouts. Group admins track collections and record cash or UPI payments. The API uses Node.js, Express 5, TypeScript, Prisma, and PostgreSQL.

The frontend is in [../frontend](../frontend/README.md). The monorepo overview is in the [root README](../README.md).

## What the API covers

- **Phone sign-in (OTP):** send a 6-digit code by SMS and verify it for a JWT. Codes are stored only as hashes, expire after 5 minutes, and are limited by attempt counts, a 30-second resend cooldown, and five sends per hour.
- **Local test login:** in development, a fixed code (`560142`) signs in the seeded test numbers and any other number, with no SMS. It is always refused in production.
- **Email and password login:** for the seeded admin accounts and any accounts created through `POST /api/auth/register`.
- **Role tiers:** Super Admin, group Admin, and Member (see [Roles](#roles)).
- **Groups, bishis, memberships, transactions, messages, notifications, and audit logs:** CRUD endpoints with token checks and validation.
- **Dues and manual payments:** group admins create monthly dues for their members and mark them paid in cash or by UPI. Each payment is written to the audit log.
- **Frontend read endpoints:** the groups summary, the alerts feed, the profile with Pro status, and the member's own dues.
- **Swagger UI** with an **Authorize** button for JWT testing.

## Status

### Done

- Prisma models for users, roles, permissions, groups, bishis, transactions, memberships, messages, notifications, audit logs, OTP codes, and contributions (dues).
- Phone OTP sign-in with hashed codes, expiry, attempt limits, resend cooldown, and hourly send caps.
- Local test code `560142`, active only when `NODE_ENV=development` or `USE_LOCAL_OTP=true`. It works for any phone number that belongs to an account in the database, and never in production. Console logs mark each use.
- Production guard: the local bypass is refused whenever `NODE_ENV=production`, even if `USE_LOCAL_OTP=true` is set.
- Role tiers: `super_admin`, `admin` (existing platform role, kept for compatibility), and `user`. Group admin rights come from the membership row.
- Manual payment marking: `POST /api/contributions/:id/mark-paid` with method `CASH` or `UPI`, a timestamp, the recorder, and an audit entry in one transaction. Paying an already-paid due returns 409.
- Monthly dues generation: `POST /api/contributions/generate` creates a pending due for each active member, keeping existing dues.
- Read endpoints for the frontend: `GET /api/groups`, `GET /api/alerts`, `GET /api/user/profile`, `PATCH /api/user/profile` (language), and `GET /api/user/dues`.
- Profile language preference (`language`, one of ten supported codes).
- Swagger UI at `/api-docs` with a bearer JWT security scheme.
- Unit and HTTP tests with Jest and Supertest, using a mocked Prisma client and SMS sender. The suite has 166 tests.
- Seed script for roles, permissions, and the default accounts.

### In progress

- Nothing is in progress on the backend.

### Pending

- A real SMS provider. `SMS_PROVIDER` only supports `console`, so OTPs are not delivered to phones outside development.
- Member self-service payments. Members can see their dues, but cannot pay through the app.
- Moving the legacy `admin` role's platform-wide checks (user routes, full group list) to `super_admin`.
- Automatic audit logging for create, update, and delete on entities other than dues.
- Field-level validation tests for each resource beyond the empty-body and missing-field cases.
- Bishi draw and winner-selection workflows.
- Creating groups and inviting members through the API (the frontend shows placeholders for these).

## Roles

| Role | Stored as | Access |
| --- | --- | --- |
| Super Admin | `super_admin` | Sees every group. The only role that can use the `/api/users` routes. Can manage dues for any group. Seeded locally as `superadmin@admin.com`. |
| Admin (group organizer) | Membership with `role = "admin"` on the group | Creates dues and marks them paid for their own groups. Sees their groups in the list. |
| Admin (legacy platform role) | `admin` | Keeps its previous access to user routes, deletes, and the full group list. Planned to move to `super_admin`. |
| Member | `user` | Sees the groups they belong to and their own dues. Cannot mark payments or manage dues. |

Roles are rows in the `Role` table, linked to users by `User.roleId`. Permissions are in `Permission` and joined through `RolePermission`. The role name is put in the JWT (`role` claim) and checked by the middleware in `src/middlewares/auth.ts`.

## Dues and payments

1. A group admin calls `POST /api/contributions/generate` with `groupId`, `period` (`YYYY-MM`), and `amount`. Each active member gets one `PENDING` due for that period.
2. The admin lists the group's dues with `GET /api/contributions?groupId=<id>&status=PENDING`.
3. When a member settles offline, the admin calls `POST /api/contributions/:id/mark-paid` with `{ "method": "CASH" }` or `{ "method": "UPI" }`.
4. The due becomes `PAID` and stores `method`, `paidAt`, and `markedById`. An `AuditLog` row is written with action `CONTRIBUTION_PAID_CASH` or `CONTRIBUTION_PAID_UPI`, the due's ID, and the admin's ID.

Rules:
- Only the group's admin, or a Super Admin, can generate, list, or mark dues. Anyone else gets 403.
- A period must be `YYYY-MM`. An amount must be positive. A method must be `CASH` or `UPI`.
- Marking a due that is already paid returns 409.
- Members never see other members' dues through these endpoints.

## Project structure

```text
backend/
├── prisma/
│   ├── schema.prisma        # Data models (User, Role, Permission, Group, Membership, Contribution, AuditLog, ...)
│   ├── migrations/          # Local migration history, git-ignored (create with prisma migrate dev)
│   ├── seed.ts              # Roles, permissions, and default accounts
│   └── seedUsers.ts         # Default phone-login users (admin and member)
├── src/
│   ├── config/swagger.ts    # OpenAPI setup, including the bearer JWT scheme
│   ├── controllers/         # HTTP handlers (thin: read the request, call a service, send the response)
│   ├── middlewares/         # authMiddleware (token), authorizeRoles (role), requireSuperAdmin (DB role check), errorHandler
│   ├── routes/              # Route definitions with Swagger comments
│   ├── services/            # Business rules and database access
│   ├── utils/               # OTP and phone helpers, role constants, HTTP errors, validation
│   ├── app.ts               # Express app: middleware, routes, Swagger, error handler
│   ├── prismaClient.ts      # Prisma client
│   └── server.ts            # Loads .env and starts the server
├── tests/
│   ├── unit/                # Pure logic and services with a mocked Prisma client
│   ├── http/                # Supertest calls against the real Express app (mocked database)
│   ├── helpers/             # prismaMock.ts, statusOf.ts
│   ├── e2e/                 # End-to-end suite against a running server and database
│   └── setupEnv.ts          # Test environment (NODE_ENV=test, local OTP off)
├── jest.config.js
└── package.json
```

## Getting started

### Requirements

- Node.js 20 or later, and npm
- PostgreSQL

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create `backend/.env`. It is git-ignored.

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/bishi_db?schema=public"
PORT=5000
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=1d
BCRYPT_SALT_ROUNDS=10
SMS_PROVIDER=console
NODE_ENV=development
USE_LOCAL_OTP=true
```

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | none (required) | PostgreSQL connection string |
| `PORT` | `5000` | HTTP port |
| `JWT_SECRET` | none (required) | Signs login tokens. Use a long random value. |
| `JWT_EXPIRES_IN` | `1d` | Token lifetime |
| `BCRYPT_SALT_ROUNDS` | `10` | Password hashing cost |
| `SMS_PROVIDER` | `console` | `console` logs OTPs instead of sending them. No other provider exists yet. |
| `NODE_ENV` | unset | `development` enables the local test login. `production` disables it and hides OTPs in SMS logs. |
| `USE_LOCAL_OTP` | `false` | `true` enables the local test login even when `NODE_ENV` is not `development`. Ignored in production. |

Never set `NODE_ENV=development` or `USE_LOCAL_OTP=true` on a server that serves real users.

### 3. Apply the database migrations

```bash
npm run prisma:generate
npx prisma migrate deploy     # applies the local migrations to DATABASE_URL
```

Use `npx prisma migrate dev` only while developing a new migration. It can reset a development database when it finds drift.

### 4. Seed the roles and default accounts

```bash
npm run prisma:seed
```

The seed is safe to run more than once. It creates:

| Account | Sign-in | Role |
| --- | --- | --- |
| Admin | email `admin@admin.com`, password `admin@123` | `admin` |
| Super Admin | email `superadmin@admin.com`, password `superadmin@123` | `super_admin` |
| Admin (phone) | phone `+911234567890`, OTP `560142` | `admin` |
| Member (phone) | phone `+911234567891`, OTP `560142` | `user` |

Passwords shown here are for local development only. Change them before any shared or production database is seeded.

Run the seed before registering users through the API. Registration assigns the `user` role, which must already exist.

### 5. Start the server

```bash
npm run dev
```

The API runs at `http://localhost:5000`. Swagger UI is at `http://localhost:5000/api-docs/#/`. A production build runs with `npm run build` then `npm start`.

## Authentication

### Phone OTP (used by the app)

1. `POST /api/auth/send-otp` with `{ "phone": "9876543210" }`. Returns the expiry and the resend cooldown, never the code.
2. `POST /api/auth/verify-otp` with `{ "phone": "9876543210", "otp": "482616" }`. Returns `{ success, token, user }`. A phone number must belong to an existing account. Send-otp and verify-otp both return 404 for any other number, and no code is sent. The response and the JWT carry the user's role and permission names from the database.

Local test login (development only):
- Any account in the database, including `+911234567890`, `+911234567891` and the Super Admin `+911234567892`: verify-otp accepts `560142`. send-otp still sends the real code through the console sender.
- A number with no account gets 404 from both send-otp and verify-otp, even with local test mode on.
- Set `NODE_ENV=production`: the bypass is refused with `401`. The dummy number is refused with `400`.

Console output in local mode:
- `[otp] LOCAL DUMMY LOGIN: ... uses code 560142. No SMS sent.` on send
- `[otp] LOCAL DUMMY LOGIN: accepted test code for ...` or `[otp] LOCAL TEST MODE: accepted test code for ...` on verify
- `[sms] to +91...: Your BhishiPay code is ...` when a real OTP is sent through the console sender

### Email and password

`POST /api/auth/register` with `name`, `email`, and `password` creates a `user` account. `POST /api/auth/login` with `email` and `password` returns a token. Phone-only accounts have no password and cannot use this route.

### Using a token

Send the token in the `Authorization` header:

```http
Authorization: Bearer <token>
```

In Swagger UI, click **Authorize**, paste the token without the word `Bearer`, and try protected endpoints.

## API

All routes use the `/api` prefix. Errors return `{ "success": false, "message": "..." }`. Validation failures return 400, a missing or invalid token returns 401, a forbidden action returns 403, unknown IDs return 404, a conflict returns 409, and rate limits return 429.

| Area | Route | Access | Operations |
| --- | --- | --- | --- |
| Auth | `/api/auth` | Public | `POST /send-otp`, `POST /verify-otp`, `POST /login`, `POST /register` |
| Users | `/api/users` | Super Admin only (`requireSuperAdmin`, role read from the database). Other roles get 403. | `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id` |
| Groups | `/api/groups` | Token; deletes need admin | CRUD. `GET /` returns the caller's groups, or every group for admin and Super Admin, with the savings summary. |
| Bishis | `/api/bishis` | Token; deletes need admin | CRUD |
| Transactions | `/api/transactions` | Token; deletes need admin | CRUD |
| Memberships | `/api/memberships` | Token; deletes need admin | CRUD |
| Messages | `/api/messages` | Token; deletes need admin | CRUD |
| Notifications | `/api/notifications` | Token; deletes need admin | CRUD |
| Audit logs | `/api/audits` | Token; deletes need admin | CRUD |
| Alerts | `/api/alerts` | Token | `GET /?category=all\|winners\|members\|rounds` |
| Profile | `/api/user/profile` | Token | `GET /`, `PATCH /` with `{ "language": "en" \| "hi" \| "mr" \| "ta" \| "te" \| "kn" \| "bn" \| "pa" \| "gu" \| "mwr" }` |
| My dues | `/api/user/dues` | Token | `GET /` (the caller's dues, newest period first) |
| Contributions | `/api/contributions` | Token; group admin or Super Admin | `GET /?groupId=&status=`, `POST /generate`, `POST /:id/mark-paid` |

The health check is `GET /`. Swagger UI documents every route, with request bodies and response codes.

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run the development server with automatic restart |
| `npm run build` | Compile TypeScript into `dist/` |
| `npm start` | Run the compiled server |
| `npm run prisma:generate` | Generate the Prisma client |
| `npx prisma migrate deploy` | Apply local migrations to `DATABASE_URL` (migrations are git-ignored) |
| `npm run prisma:seed` | Create roles, permissions, and default accounts |
| `npx prisma studio` | Open Prisma Studio |
| `npm run test:unit` | Run the Jest unit and HTTP tests (no database needed) |
| `npm run test:e2e` | Run the end-to-end suite against the database in `.env` |
| `npx tsc --noEmit` | Type-check the backend |

## Testing

### Unit and HTTP tests

```bash
npm run test:unit
```

Jest with ts-jest and Supertest. Prisma and the SMS sender are mocked (`tests/helpers/prismaMock.ts`), so no database is needed. `resetMocks` is on, so each test re-attaches the mock behaviour it needs.

| Test file | Covers |
| --- | --- |
| `unit/otp.service.test.ts`, `unit/otp.util.test.ts` | OTP generation, hashing, expiry, attempts, cooldown, hourly cap, local test login, production guard |
| `unit/phone.test.ts`, `unit/auth.phone.test.ts` | Phone normalisation and the local test numbers |
| `unit/seedUsers.test.ts` | Default phone users and their local-only sign-in |
| `unit/contribution.service.test.ts` | Dues generation, marking paid, audit entry, 403, 404, 409, Super Admin rights |
| `unit/profile.*.test.ts`, `unit/profile.service.test.ts` | Profile mapping, Pro status, language update |
| `unit/group.*.test.ts`, `unit/alert.mapper.test.ts` | Group and alert mapping, group service |
| `unit/swagger.test.ts` | The bearer JWT scheme and global security |
| `http/auth.http.test.ts` | Send-OTP and verify-OTP over HTTP, including the local test login |
| `http/contributions.http.test.ts` | 401 without a token, 403 for members, 200 for admins, the member's own dues |
| `http/profile.http.test.ts` | Language update over HTTP |
| `http/resources.http.test.ts` | CRUD routes, validation, role checks |

### End-to-end tests

```bash
npm run test:e2e
```

The suite under `tests/e2e/` starts the backend on port `5055` (set `TEST_PORT` to change it) and runs endpoint checks against the database in `.env`. It creates and deletes its own records, so use a separate database with `TEST_DATABASE_URL` when you can. To test a server you already started, set `API_BASE_URL`. The admin login defaults to the seeded account; override it with `E2E_ADMIN_EMAIL` and `E2E_ADMIN_PASSWORD`.

## Known limitations

- OTPs are not delivered to phones. Only the console sender exists.
- The local test login is a development tool. Its code is public, so keep it disabled on any shared server.
- The legacy `admin` role still has platform-wide access to groups and deletes, but not to the `/api/users` routes. See [Roles](#roles).
- Some seeded passwords are fixed defaults for local use.

## Author

**Shailendra Pardeshi**
Senior Full Stack Developer
[LinkedIn](https://www.linkedin.com/in/shailendra-pardeshi-031596192) · shailendrapardeshi123@gmail.com
