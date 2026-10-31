# BhishiPay — Frontend

Mobile-first client for BhishiPay, a savings and bidding app for Bhishi (chit fund) circles. Built with Vue 3, Ionic 9, Vite, Pinia, and Tailwind CSS, with TypeScript throughout. It runs in the browser today and is set up to become a native app through Capacitor.

It talks to the [backend](../backend/README.md) REST API.

## Scope

- Sign in with a phone number and a one-time password (OTP).
- A groups dashboard with the user's total circle savings and each active group's bidding status.
- An alerts feed for round, member, and winner activity, with filters and auto-refresh.
- Profile and settings, including account verification status and the BhishiPay Pro banner.
- A Loan/Ledger tab, currently a placeholder.

The screens follow the five reference designs: Login, OTP verification, Groups, Alerts, and Profile & Settings.

Out of scope for now: creating groups, adding members, buying Pro, payment screens, and multi-language UI.

## Status

### Done

- **Sign-in:** phone entry with the +91 prefix and validation, then OTP verification with six-box input, paste support, a 30-second resend cooldown, and a back/change-number path.
- **Routing:** `/login`, `/otp`, and `/tabs/groups|alerts|loan|profile` (Ionic tabs). Signed-out users are redirected to login, and signed-in users are kept out of the sign-in screens.
- **Floating glass tab bar** with the four tabs and an active state.
- **Groups screen:** greeting, savings hero card, group cards with status badges (BIDDING, OPEN, CLOSED), next bid time, and loading, empty, and error states.
- **Alerts screen:** All, Winners, Members, and Rounds filters; day-grouped items (Today, Yesterday, then dates); unread count; a 30-second poll while the tab is visible.
- **Profile screen:** user card, Pro banner (hidden for Pro members), Account and Settings lists, Share (where the device supports it), and log out.
- **API layer:** a single Axios service (`src/services/api.service.ts`) with typed calls for send-otp, verify-otp, groups, alerts, and profile, plus a bearer-token interceptor and readable error messages.
- **State (Pinia):** `auth`, `groups`, `alerts` (with polling), and `profile`. Logging out clears the data loaded for the previous user.
- **Styling:** Tailwind CSS v4 for the design system, with the BhishiPay palette set as theme tokens. Preflight is off so it doesn't fight Ionic's own base styles.
- **Tests:** 55 unit tests across 9 files (Vitest and Vue Test Utils, with `vi.mock` for the API), and a Playwright smoke test for the sign-in redirect.
- **Action dialogs:** a shared `InfoModal` for the Create group, Add Members, Get Pro, and Edit profile actions.

### In progress

- Nothing is in progress on the frontend at the moment.

### Pending

- **Create group and add members:** the `+` button and Add Members open dialogs that explain the feature is coming. Creating groups and inviting members need API endpoints that don't exist yet.
- **Loan/Ledger screen:** the content is not designed or built.
- **Pro subscription purchase:** the Get Pro banner opens a dialog with the plan details. Purchasing is not connected.
- **Profile editing:** the Edit action opens a dialog that shows the current details. Saving changes needs a profile update endpoint.
- **Language switching:** the language row displays the stored value but can't change it.
- **Visual QA:** the screens were built from the reference images but have not yet been compared pixel-by-pixel in a browser.
- **Real-time updates:** the alerts feed polls every 30 seconds. Push delivery (WebSocket or FCM) is not built.
- **Native builds:** the Capacitor packages are installed, but there are no `android/` or `ios/` projects yet.
- **End-to-end coverage:** only the sign-in redirect is tested end to end. The OTP and tab flows need Playwright tests.
- **Production config:** the API base URL is set from `VITE_API_BASE_URL`. Secure token storage (Capacitor Preferences or Keychain) replaces the current `localStorage` before release.

## Plan

There is no separate PRD or epic list in this repository yet. The phases below are derived from the current code and the pending items above, so treat the order as a proposal.

| Phase | Goal | Status |
| --- | --- | --- |
| 1. Foundation | App shell, routing, Tailwind and Ionic theme, API layer, state stores, unit tests | Done |
| 2. Core screens | Sign-in with OTP, groups dashboard, alerts feed, profile and settings | Done |
| 3. Group actions | Create group, add members, Loan/Ledger screen, Pro purchase, profile editing | Pending |
| 4. Quality and release | Visual QA against designs, end-to-end flow tests, native projects, secure token storage | Pending |

## Tech stack

- Vue 3 with TypeScript and `<script setup>`
- Ionic 9 (`@ionic/vue`, `@ionic/vue-router`) for the page shell, tabs, and router
- Tailwind CSS v4 (`@tailwindcss/vite`) for the screen styling
- Pinia for state, axios for HTTP
- Vite, with ESLint and Prettier
- Capacitor packages (installed, native projects not yet added)
- Vitest and `@vue/test-utils` for unit tests; Playwright for end-to-end tests

## Project structure

```text
frontend/
├── src/
│   ├── components/         # Reusable UI: header, tab bar, group card, OTP boxes, alert rows, settings list
│   ├── router/             # Routes and the auth guard
│   ├── services/           # api.service.ts (HTTP calls and types), session.ts (token storage)
│   ├── stores/             # Pinia stores: auth, groups, alerts, profile
│   ├── styles/             # tailwind.css (theme tokens and Tailwind layers)
│   ├── theme/              # variables.css (Ionic theme variables)
│   ├── utils/              # format.ts (phone, currency, time, alert grouping helpers)
│   ├── views/              # LoginPage, OtpPage, and tabs/ (Groups, Alerts, Loan, Profile)
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

## Design tokens

| Token | Value | Use |
| --- | --- | --- |
| `pearl` | `#F8FAFC` | Page background |
| `midnight` | `#0F172A` | Primary buttons, dark cards, headings |
| `champagne` | `#C5A059` | Accents, Pro tier, borders on focus |
| `champagne-light` | `#E5C585` | Gold tints for badges and icon tiles |
| `champagne-dark` | `#8A6A2F` | Gold text on light backgrounds (contrast) |
| `mint` | `#10B981` | Active states, unread dots, success |

The tokens are defined in `src/styles/tailwind.css` (`@theme`) and mapped to Ionic's theme variables in `src/theme/variables.css`.

## Getting started

### Requirements

- Node.js and npm (tested with Node 22.13)
- The backend running locally (see [backend/README.md](../backend/README.md))

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the API address

```bash
cp .env.example .env
```

`VITE_API_BASE_URL` points the app at the backend API and defaults to `http://localhost:5000/api`. On an Android emulator, use `http://10.0.2.2:5000/api` to reach the host machine.

### 3. Start the dev server

```bash
npm run dev
```

Open the app, enter a 10-digit Indian mobile number, and check the backend console for the OTP. The backend's console SMS sender logs the code in development.

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint, the e2e type check, and Prettier |
| `npm run lint:fix` | Fix ESLint and Prettier issues where possible |
| `npm run typecheck:e2e` | Type-check the end-to-end tests |
| `npm run test:unit` | Run the Vitest unit tests |
| `npm run test:unit:watch` | Run Vitest in watch mode |
| `npm run test:e2e` | Run the Playwright tests (starts the dev server on port 5173) |
| `npm test` | Run unit tests, then end-to-end tests |

## Testing

Unit tests live in `tests/unit/`:

| File | Covers |
| --- | --- |
| `LoginPage.spec.ts` | Phone validation, +91 normalisation, sending the OTP, navigation, server errors |
| `OtpBoxes.spec.ts` | Typing, auto-advance, backspace, paste, completion |
| `GroupCard.spec.ts` | Name, members, rupee formatting, status badges, next bid, Add Members event |
| `auth.store.spec.ts` | Requesting and verifying an OTP, failed verification, logout and data reset |
| `alerts.store.spec.ts` | Filtering, error handling, polling start and stop |
| `api.service.spec.ts` | Endpoints and parameters, bearer header, error messages (Axios mocked) |
| `InfoModal.spec.ts` | Dialog content, open and closed states, close button and custom label |
| `GroupsPage.spec.ts` | `+` opens the create-group dialog, Add Members opens it for the right group |
| `utils.spec.ts` | Phone, currency, time, bid-time, and alert-day helpers |

`jsdom` is pinned to 26.x. Newer versions need Node 22.22 or later.

End-to-end tests (`tests/e2e/`) currently cover the sign-in redirect. Playwright starts the dev server through `playwright.config.ts`.

## Author

**Shailendra Pardeshi**
Senior Full Stack Developer
[LinkedIn](https://www.linkedin.com/in/shailendra-pardeshi-031596192) · shailendrapardeshi123@gmail.com
