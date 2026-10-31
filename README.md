# BhishiPay (Bishi Management System)

BhishiPay is a savings and bidding app for Bhishi (chit fund) circles. Members join a group, pay their monthly contribution, and bid for each payout. Group admins track collections and record payments that members settle in cash or by UPI. The monorepo holds the REST API and the mobile-first web app.

- [backend/](backend/README.md): Node.js, Express 5, TypeScript, Prisma, PostgreSQL
- [frontend/](frontend/README.md): Vue 3, Ionic 9, Vite, Pinia, vue-i18n, SCSS

## Repository layout

```text
Bishi-Management-System/
├── backend/          REST API: auth, groups, dues, audit log, Swagger
├── frontend/         Web app (Capacitor-ready): sign-in, groups, dues, alerts, profile
├── _bmad/            BMAD agent configuration
├── _bmad-output/     BMAD generated artifacts
├── .agent/           Agent skills
├── .agents/          Agent definitions
├── .claude/          Claude Code project settings
├── .gitignore        Ignores secrets, build output, and local tool settings
└── README.md         This file
```

## Local URLs

| Service | URL | Notes |
| --- | --- | --- |
| Frontend (sign-in screen) | http://localhost:5173/login | Vite dev server |
| Backend API | http://localhost:5000/api | Base URL for all API routes |
| Swagger UI | http://localhost:5000/api-docs/#/ | Click **Authorize** to use a token |
| Health check | http://localhost:5000/ | Returns `Bishi API is running` |

## Quick start

Prerequisites: Node.js 20 or later, npm, and a PostgreSQL database.

```bash
# 1. Backend: install, create backend/.env (see backend/README.md), then migrate and seed
cd backend
npm install
npm run prisma:generate
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev                  # http://localhost:5000

# 2. Frontend, in a second terminal
cd frontend
npm install
npm run dev                  # http://localhost:5173/login
```

Open http://localhost:5173/login and sign in with the dummy login below.

## Dummy login for local testing

No SMS is needed for local testing. The OTP is fixed: `560142`.

| Phone number | OTP | Account | Result |
| --- | --- | --- | --- |
| `+91 1234567890` | `560142` | Admin (seeded) | Signs in at once. No SMS is sent. |
| `+91 1234567891` | `560142` | Member (seeded) | Signs in with the fixed code. |
| Any account in the database, such as the Super Admin `+91 1234567892` | `560142` | Existing account | Signs in with the fixed code. A number with no account returns 404. |

The fixed code works only when the backend runs with `NODE_ENV=development` or `USE_LOCAL_OTP=true` in `backend/.env`. It is refused in production even when `USE_LOCAL_OTP=true` is set. The backend logs each use, for example `[otp] LOCAL DUMMY LOGIN: accepted test code for +911234567890`.

The real SMS code still works in local mode. Until an SMS provider is added, the console sender writes the code to the backend console.

A server that was already running keeps its old settings. Restart it after changing `.env`.

## Roles and access

There are three tiers. The role lives on the user (`Role` table) and is carried in the login token. Group rights come from the membership.

| Tier | Role | What it can do |
| --- | --- | --- |
| Super Admin | `super_admin` | Platform owner. Sees every group, can manage dues for any group, and is the only role that can use the master settings (`/api/users` and `/api/super-admin`). Seeded locally as `superadmin@admin.com` / `superadmin@123`, phone `+91 1234567892`. |
| Admin (group organizer) | Member of a group with `Membership.role = "admin"` | Creates the group's dues, lists them, and marks payments as paid. Sees the groups they belong to. |
| Member | `user` | Sees only the groups they belong to, and their own dues. Cannot create dues or mark payments. |

The platform `admin` role no longer reaches the user routes (`/api/users`); those return 403. It keeps its access to the full group list and to deletes, as a legacy role. Move those checks to `super_admin` when you are ready.

## Master settings (Super Admin)

Super Admins manage platform-wide data from the app. Sign in as a Super Admin, open **Profile**, and tap **Master settings**. The screens are at `/admin/super-admin`.

| Screen | What it does |
| --- | --- |
| Users | Create, edit, and delete users. Assign a role. A phone number is required and must be unique. |
| Roles | Create, rename, and delete roles. A role that users still hold cannot be deleted. |
| Permissions | Create, rename, and delete permissions. |
| Role permissions | Give a permission to a role, or take it away. |
| Groups | Create, edit, and delete groups. A group with dues or payments recorded cannot be deleted. |
| Bishis | Create, edit, and delete rounds across groups. |
| Transactions | Read-only list across groups. |
| Audit logs | Read-only trail of every change, newest first. |

Every change is recorded in the audit log with the Super Admin who made it. The API is under `/api/super-admin` (see [backend/README.md](backend/README.md#master-settings-super-admin)). Anyone else who opens these screens is sent back to the groups tab, and the API returns 403.

## Dues and manual payments

BhishiPay does not take money. Group admins record payments that members settle offline, in cash or by direct UPI.

1. The admin opens a group they administer and taps **Dues** on the group card.
2. **Create dues for <month>** makes one pending due per member at the group's monthly contribution. Existing dues are kept.
3. The admin taps **Mark paid** on a due, chooses **Cash** or **UPI**, and confirms. The app records the method, the time, and the admin who recorded it.
4. Each payment writes an audit entry (`CONTRIBUTION_PAID_CASH` or `CONTRIBUTION_PAID_UPI`). A due that is already paid cannot be marked again (409).

API: `GET /api/contributions?groupId=`, `POST /api/contributions/generate`, `POST /api/contributions/:id/mark-paid`, and `GET /api/user/dues`.

Not built yet: members paying through the app.

## Swagger authorization

1. Open http://localhost:5000/api-docs/#/.
2. Get a token with `POST /api/auth/verify-otp` (phone) or `POST /api/auth/login` (email and password).
3. Click **Authorize**, paste the token without the word `Bearer`, and click **Authorize**.

Protected endpoints now send the token. Public endpoints ignore it.

## Languages

The app supports ten languages: English (`en`), Hindi (`hi`), Marathi (`mr`), Tamil (`ta`), Telugu (`te`), Kannada (`kn`), Bengali (`bn`), Punjabi (`pa`), Gujarati (`gu`), and Marwari (`mwr`).

- Translations are in `frontend/src/locales/<code>.json`. Every file has the same keys as `en.json`, and a test checks that.
- The picker is in **Profile**, under **Language preference**. The change applies at once and is saved to the user's profile (`PATCH /api/user/profile`, field `language`).
- The language last used on a device is applied on the next launch, before the profile loads.
- Alert text and group names come from the API in English.
- The translations for languages other than English were written without native reviewers. Have them checked before release.

## Styling

The app uses an SCSS utility system with Bootstrap-style class names. It has no Tailwind and no inline styles.

- `frontend/src/styles/_tokens.scss`: the palette (pearl `#F8FAFC`, midnight `#0F172A`, champagne `#C5A059`), the spacing scale, radii, shadows, font sizes, and weights.
- `frontend/src/styles/_mixins.scss`: generators that turn each token map into classes.
- `frontend/src/styles/_utilities.scss`: the generated utility classes, such as `p-5`, `fs-15`, `fw-semibold`, `rounded-3xl`, `shadow-card`, and `bg-champagne-light-35`.
- `frontend/src/styles/_components.scss`: classes for elements with states, such as `bh-field`, `bh-btn`, `bh-otp-box`, `bh-tabbar`, `bh-pill`, and `bh-status`.
- `frontend/src/theme/ionic.scss`: Ionic's theme variables, built from the same tokens.

A check confirms that every class used in a template exists in the compiled CSS:

```bash
cd frontend
npx sass --no-source-map src/styles/main.scss "$TEMP/app.css"
node scripts/check-classes.mjs "$TEMP/app.css"
```

## Testing

| Suite | Command | Count | Notes |
| --- | --- | --- | --- |
| Backend unit and HTTP (Jest) | `cd backend && npm run test:unit` | Run for the current count | No database. Prisma and SMS are mocked. |
| Backend end-to-end | `cd backend && npm run test:e2e` | Node test runner | Uses the database in `.env`. |
| Frontend unit (Vitest) | `cd frontend && npx vitest run` | Run for the current count | Vue Test Utils with mocked API. |
| Frontend browser (Playwright) | `cd frontend && npx playwright test` | 2 tests | Needs the backend running with local OTP enabled. |

To run the browser tests against a backend on another port:

```bash
cd frontend
E2E_PORT=5174 VITE_API_BASE_URL=http://localhost:5077/api npx playwright test
```

Type checks and builds:

```bash
cd backend && npx tsc --noEmit
cd frontend && npx vue-tsc --noEmit && npx vite build
```

## Database

- The schema is `backend/prisma/schema.prisma`. Migrations are not tracked in git (`backend/prisma/migrations/` is ignored). A fresh database is built from the schema with `npx prisma migrate dev --name init`, which writes a local migration and applies it.
- The seed (`npm run prisma:seed`) is safe to run more than once. It creates the roles, the permissions, and the default accounts listed in the backend README.
- Use `prisma migrate dev` only while you are writing a new migration. It can reset a development database when it finds drift.

## Environment files and secrets

- `.env` and `.env.local` files hold secrets and are git-ignored. Commit only `.env.example` files, with placeholder values.
- Never set `NODE_ENV=development` or `USE_LOCAL_OTP=true` on a server that serves real users. The local login accepts a public code.
- The seeded passwords (`admin@123`, `superadmin@123`) are for local development. Change them before seeding any shared database.

## Repository notes

- Build output (`dist/`, `build/`), `node_modules/`, and Playwright output (`test-results/`) are not tracked.
- Keep personal overrides such as `.claude/settings.local.json` out of git.

## Known limitations

- SMS is not delivered. The only sender writes the code to the console.
- Members cannot pay through the app.
- The Super Admin master screens use English text only. They are not yet in the other nine languages.
- Create group, add members, Pro purchase, Loan/Ledger, and profile editing are placeholders.
- The access token is kept in `localStorage`. Use secure storage before a store release.
- Visual screens have not yet been compared pixel by pixel with the reference designs.
