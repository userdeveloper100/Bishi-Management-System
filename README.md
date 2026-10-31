# Bishi Management System

Monorepo for the Bishi Management System, containing the backend API and the frontend app.

## Structure

```
Bishi-Management-System/
├── backend/        Node.js API (TypeScript, Prisma)
├── frontend/       Web/mobile client (Vite, Ionic, Capacitor)
├── _bmad/          BMAD agent configuration
├── _bmad-output/   BMAD generated artifacts
├── .agent/         Agent skills
├── .agents/        Agent definitions
└── .claude/        Claude Code project settings
```

## Prerequisites

- Node.js 20 or later
- npm

## Getting started

### Backend

Requires a PostgreSQL database.

```bash
cd backend
npm install
```

Create `backend/.env` with these variables: `PORT`, `DB_USER`, `DB_PASS`, `DB_HOST`, `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `BCRYPT_SALT_ROUNDS`.

```bash
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Other scripts: `npm run dev:seed`, `npm run prisma:seed`, `npm run build`, `npm start`, `npm run lint`, `npm run test:e2e`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Other scripts: `npm run build`, `npm run preview`, `npm run lint`, `npm run typecheck:e2e`, `npm run test:unit`, `npm run test:e2e`.

## Environment files

`.env` and `.env.local` files hold secrets and are git-ignored. Commit only `.env.example` files, with placeholder values.

## Repository notes

- Build output (`dist/`, `build/`) and `node_modules/` are not tracked.
- Keep personal overrides such as `.claude/settings.local.json` out of git.
