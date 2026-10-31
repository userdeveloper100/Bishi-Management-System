# Bishi Management System — Frontend

Mobile-first client for the Bishi (chit fund) management system. The app is built with Vue 3, Ionic, Vite, and TypeScript, and is set up to run in the browser and, later, as a native app through Capacitor.

It talks to the [backend](../backend/README.md) REST API.

## Scope

The frontend lets users create an account, sign in, and work with the groups, bishis, memberships, transactions, messages, and notifications that the backend provides. Native builds are part of the plan, not yet set up.

Out of scope for now: payment screens, bishi draw and winner-selection screens, and multi-language UI.

## Status

### Done

- Project setup with Vite, Vue 3, Ionic 9, Vue Router, Pinia, and axios.
- Tooling: ESLint, Prettier, TypeScript type checks, Vitest for unit tests, and Playwright for end-to-end tests.
- Routing with an auth guard: signed-out users go to `/login`; signed-in users are sent away from `/login` and `/register`.
- Login and register pages. Registering creates the account and then signs the user in.
- Auth store (Pinia) that keeps the token and user, and clears them on logout.
- API client (axios) that adds the `Authorization: Bearer` header and turns backend errors into readable messages.
- Session token storage in `src/api/session.ts`.
- Home page with a welcome message and a logout button.
- Unit tests for the auth store (5 tests in `tests/unit/auth.store.spec.ts`).
- Playwright smoke test that opens the app root (`tests/e2e/app.spec.ts`).

### In progress

- Nothing is in progress on the frontend at the moment.

### Pending

- Home page content. It is a placeholder that says "Your groups and bishis will appear here."
- Screens for each backend resource: groups, bishis, memberships, transactions, messages, notifications, and audit logs.
- Role-aware UI so `admin` users see the admin actions.
- Loading and empty states across screens.
- End-to-end tests beyond the smoke test: login, register, and logout flows.
- Capacitor native platforms. The Capacitor packages are installed, but there is no `android/` or `ios/` project yet.
- Production configuration for the API base URL.

## Plan

There is no separate PRD or epic list in this repository yet. The phases below are derived from the current code and the pending items above, so treat the order as a proposal.

| Phase | Goal | Status |
| --- | --- | --- |
| 1. Foundation | App shell, routing, auth flow, API client, tooling, tests | Done |
| 2. Core screens | Groups, bishis, memberships, and transactions screens; real home dashboard | Pending |
| 3. Messaging and admin | Messages, notifications, audit view, role-aware admin actions | Pending |
| 4. Native and release | Capacitor Android and iOS projects, production config, end-to-end test coverage | Pending |

## Tech stack

- Vue 3 with TypeScript and `<script setup>`
- Ionic 9 (`@ionic/vue`, `@ionic/vue-router`) and Ionicons
- Vite
- Vue Router 5
- Pinia for state
- axios for HTTP
- Capacitor (`@capacitor/core`, `app`, `haptics`, `keyboard`, `status-bar`)
- Vitest and `@vue/test-utils` for unit tests; Playwright for end-to-end tests

## Project structure

```text
frontend/
├── src/
│   ├── api/                # HTTP client, auth calls, session storage
│   ├── router/             # Routes and auth guard
│   ├── stores/             # Pinia stores (auth)
│   ├── theme/              # Global styles and Ionic variables
│   ├── views/              # Pages: Login, Register, Home
│   ├── App.vue
│   └── main.ts
├── tests/
│   ├── e2e/                # Playwright tests
│   └── unit/               # Vitest unit tests
├── capacitor.config.ts
├── vite.config.ts
├── playwright.config.ts
└── package.json
```

## Getting started

### Requirements

- Node.js and npm
- The backend running locally (see [backend/README.md](../backend/README.md))

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the API address

Copy the example file and adjust it if needed:

```bash
cp .env.example .env
```

`VITE_API_BASE_URL` points the app at the backend API. It defaults to `http://localhost:5000/api` when not set. On an Android emulator, use `http://10.0.2.2:5000/api` to reach the host machine.

### 3. Start the dev server

```bash
npm run dev
```

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint and fix what it can |
| `npm run typecheck:e2e` | Type-check the end-to-end tests |
| `npm run test:unit` | Run Vitest unit tests |
| `npm run test:unit:watch` | Run Vitest in watch mode |
| `npm run test:e2e` | Run Playwright end-to-end tests |

## Testing

- **Unit tests** (`tests/unit/`) cover the auth store: starting logged out, storing the token and user on login, staying logged out after a failed login, registering and then logging in, and clearing the session on logout.
- **End-to-end tests** (`tests/e2e/`) currently open the app root. Playwright starts the dev server on port `5173` through `playwright.config.ts`.

`npm test` runs the unit tests and then the end-to-end tests.

```bash
npm run test:unit
npm run test:e2e
```

## Author

**Shailendra Pardeshi**
Senior Full Stack Developer
[LinkedIn](https://www.linkedin.com/in/shailendra-pardeshi-031596192) · shailendrapardeshi123@gmail.com
