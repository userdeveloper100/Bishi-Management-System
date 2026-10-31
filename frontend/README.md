# BhishiPay Frontend

Mobile-first client for BhishiPay, a savings and bidding app for Bhishi (chit fund) circles. It is built with Vue 3, Ionic 9, Vite, Pinia, vue-i18n, and SCSS, with TypeScript throughout. It runs in the browser today and is set up to become a native app through Capacitor.

It talks to the [backend](../backend/README.md) REST API. The monorepo overview is in the [root README](../README.md).

## What the app does

- **Sign in with a phone number.** Enter a 10-digit Indian mobile number, then enter the 6-digit OTP. The sign-in screen accepts the local test numbers as well (see [Local test sign-in](#local-test-sign-in)).
- **Groups dashboard.** The user's total circle savings, and a card for each group with its status (BIDDING, OPEN, CLOSED) and next bid time. Group admins see a **Dues** button on the cards they administer.
- **Dues screen for group admins** (`/admin/groups/:groupId/dues`). Lists pending and paid dues, creates the current month's dues at the group's monthly amount, and records a payment as Cash or UPI after a confirmation step.
- **Alerts feed.** All, Winners, Members, and Rounds filters, grouped by day, with an unread count. It refreshes every 30 seconds while the tab is open.
- **Profile and settings.** The user card, the BhishiPay Pro banner, Account and Settings lists, and log out. The **Language preference** row opens a picker for all ten languages. The change applies immediately and is saved to the profile.
- **Loan/Ledger tab.** A placeholder for now.
- **Floating glass tab bar** for Groups, Alerts, Loan/Ledger, and Profile.

## Status

### Done

- **Sign-in:** phone entry with the +91 prefix and validation. OTP entry uses six boxes, supports paste, has a 30-second resend cooldown, and offers a change-number path.
- **Routing:** `/login`, `/otp`, `/tabs/groups|alerts|loan|profile`, `/admin/groups/:groupId/dues`, and the Super Admin screens at `/admin/super-admin` and `/admin/super-admin/:resource`. Signed-out users are sent to login. Signed-in users are kept out of the sign-in screens. Routes marked for a role (the Super Admin screens) send any other user back to the groups tab.
- **Master settings (Super Admin):** one config-driven screen for users, roles, permissions, role permissions, groups, bishis, transactions, and audit logs. It has a list, a create and edit form, and a delete confirmation. Transactions and audit logs are read-only. The index is reached from **Profile → Master settings**, which only Super Admins see.
- **Phone entry:** the sign-in and admin screens accept any ten-digit number that does not start with 0. The backend decides whether the number has an account.
- **Groups screen:** greeting, savings hero card, group cards, and loading, empty, and error states.
- **Dues screen:** pending and paid lists, the pending total, create-this-month dues, and a Cash or UPI confirmation before a payment is recorded.
- **Alerts screen:** filters, day grouping, unread count, and polling while visible.
- **Profile screen:** user card, Pro banner (hidden for Pro members), settings lists, language picker, Share (where the device supports it), and log out.
- **Localization:** ten languages with vue-i18n. The language is remembered on the device and saved to the user's profile.
- **Styling:** an SCSS utility system built from design tokens. No Tailwind and no inline styles.
- **API layer:** one Axios client in `src/services/api.service.ts`, with typed calls, a bearer-token interceptor, and readable error messages.
- **State (Pinia):** stores for `auth`, `groups`, `alerts` (with polling), `profile`, and the language change with rollback on failure.
- **Tests:** Vitest unit tests for the components, pages, stores, API client, utilities, locales, and the Super Admin configuration and payload rules. Two Playwright browser tests (the sign-in redirect and the local dummy login). Run `npx vitest run` for the current count.

### In progress

- Nothing is in progress on the frontend.

### Pending

- **Create group and add members:** the `+` button and Add Members open dialogs that explain the feature is coming. These need API endpoints that do not exist yet.
- **Loan/Ledger screen:** not designed or built.
- **Pro subscription purchase:** the Get Pro banner opens a dialog with the plan details. Purchasing is not connected.
- **Profile editing:** the Edit action shows the current details. Saving needs a profile update endpoint for name, email, and UPI.
- **Member payments:** members cannot pay through the app. The dues screen is for admins only.
- **Visual QA:** the screens were built from the reference designs, but they have not been compared pixel by pixel in a browser.
- **Real-time updates:** alerts poll every 30 seconds. Push delivery (WebSocket or FCM) is not built.
- **Native builds:** Capacitor is installed, but there are no `android/` or `ios/` projects yet.
- **End-to-end coverage:** Playwright covers the sign-in redirect and the local dummy login. The OTP entry, the dues flow, and the tabs still need tests.
- **Secure token storage:** the token is kept in `localStorage`. Use Capacitor Preferences or the device keychain before release.

## Plan

There is no separate PRD or epic list in this repository. The phases below are derived from the current code and the pending items above.

| Phase | Goal | Status |
| --- | --- | --- |
| 1. Foundation | App shell, routing, SCSS design system and Ionic theme, API layer, state stores, unit tests | Done |
| 2. Core screens | Sign-in with OTP, groups dashboard, alerts feed, profile and settings | Done |
| 3. Localization | Ten languages, switching in Profile, saved to the profile | Done |
| 4. Collections | Admin dues screen and manual cash or UPI payment marking | Done |
| 5. Group actions | Create group, add members, Loan/Ledger, Pro purchase, profile editing | Pending |
| 6. Quality and release | Visual QA against the designs, end-to-end flow tests, native projects, secure token storage | Pending |

## Tech stack

- Vue 3 with TypeScript and `<script setup>`
- Ionic 9 (`@ionic/vue`, `@ionic/vue-router`) for the page shell, tabs, modals, and router
- SCSS (Sass) for styles: utility classes and component classes generated from design tokens
- vue-i18n 11 for the ten supported languages
- Pinia for state, Axios for HTTP
- Vite, with ESLint, Prettier, and vue-tsc
- Capacitor packages (installed, native projects not yet added)
- Vitest and `@vue/test-utils` for unit tests; Playwright for browser tests

## Project structure

```text
frontend/
├── src/
│   ├── components/      # Reusable UI: logo, header, tab bar, group card, OTP boxes, alert rows,
│   │                    #   settings list, hero card, profile card, Pro banner, InfoModal dialog
│   ├── i18n/            # vue-i18n setup: the ten locales, the stored language, setAppLocale()
│   ├── locales/         # Translation files: en, hi, mr, ta, te, kn, bn, pa, gu, mwr (same keys)
│   ├── router/          # Routes and the auth guard
│   ├── services/        # api.service.ts (every backend call and its types), session.ts (token storage)
│   ├── stores/          # Pinia stores: auth, groups, alerts, profile
│   ├── styles/          # SCSS: _tokens, _mixins, _base, _utilities, _components, main.scss
│   ├── theme/           # ionic.scss (Ionic theme variables built from the tokens)
│   ├── utils/           # format.ts (phone, currency, time, bid time, alert days),
│   │                    #   superAdminResources.ts (Super Admin screen config and the request-body rules)
│   ├── views/           # LoginPage, OtpPage, tabs/ (Groups, Alerts, Loan, Profile),
│   │                    #   admin/DuesPage, admin/SuperAdminIndexPage, admin/SuperAdminResourcePage
│   ├── App.vue
│   └── main.ts          # App setup: Ionic, Pinia, router, i18n, styles
├── scripts/
│   └── check-classes.mjs   # Checks that every class used in a template exists in the compiled CSS
├── tests/
│   ├── e2e/             # Playwright: sign-in redirect and the local dummy login
│   └── unit/            # Vitest: components, pages, stores, API client, utilities, locales
├── capacitor.config.ts
├── playwright.config.ts
├── vite.config.ts
└── package.json
```

## Design tokens

The brand palette is defined once, in `src/styles/_tokens.scss`. The utility classes are generated from it, and the Ionic theme is built from the same values.

| Token | Value | Use |
| --- | --- | --- |
| `pearl` | `#F8FAFC` | Page background |
| `midnight` | `#0F172A` | Primary buttons, dark cards, headings |
| `champagne` | `#C5A059` | Accents, Pro tier, focus borders |
| `champagne-light` | `#E5C585` | Gold tints for badges and icon tiles |
| `champagne-dark` | `#8A6A2F` | Gold text on light backgrounds (contrast) |
| `mint` | `#10B981` | Active states, unread dots, success |

## Styling

Styles use utility classes with Bootstrap-style names, plus a small set of component classes for elements with states.

- **Utilities** (`_utilities.scss`, generated by `_mixins.scss`): spacing (`p-5`, `mt-auto`, `gap-2`), typography (`fs-15`, `fw-semibold`, `lh-relaxed`, `tracking-12`), colour (`text-midnight`, `bg-champagne-light-35`, `border-slate-200`), layout (`d-flex`, `items-center`, `justify-between`), radius (`rounded-3xl`), and shadow (`shadow-card`).
- **Components** (`_components.scss`): classes for states such as `bh-field` and `bh-field--error`, `bh-btn`, `bh-link`, `bh-otp-box`, `bh-tabbar` and `bh-tab`, `bh-pill` and `bh-pill--active`, `bh-status` with its colour modifiers, `bh-alert-row`, `bh-tile`, and `bh-row`.
- **Theme:** `src/theme/ionic.scss` sets Ionic's CSS variables from the tokens.
- **Rules:** do not add inline `style` attributes. Add a token to `_tokens.scss` or a rule to `_components.scss` instead.

To check that every class used in a template is defined:

```bash
npx sass --no-source-map src/styles/main.scss "$TEMP/app.css"
node scripts/check-classes.mjs "$TEMP/app.css"
```

On macOS or Linux, use `/tmp/app.css` in place of `"$TEMP/app.css"`.

## Localization

- **Ten languages:** English (`en`), Hindi (`hi`), Marathi (`mr`), Tamil (`ta`), Telugu (`te`), Kannada (`kn`), Bengali (`bn`), Punjabi (`pa`), Gujarati (`gu`), and Marwari (`mwr`).
- **Switching:** Profile, then Language preference. The UI changes at once. The choice is also saved to the user's profile on the backend (`PATCH /api/user/profile`). If saving fails, the app reverts to the previous language and shows a message.
- **First screen:** the language last used on this device is applied before the profile loads. Once the profile loads, its saved language takes over.
- **Fallback:** missing keys fall back to English.
- **Keys:** every locale file has the same keys as `en.json`. `tests/unit/locales.spec.ts` checks that the keys match, that the `{placeholders}` match, and that no message is empty.
- **Not translated:** alert text and group names come from the API. Amounts and dates use the Indian and English number and date formats.
- **Review:** the Hindi, Marathi, and other translations were written without native reviewers. Have them checked before release.

To add a language:
1. Create `src/locales/<code>.json` with the same keys as `en.json`.
2. Add the locale in `src/i18n/index.ts` (import, `APP_LOCALES`, `messages`).
3. Add it to the picker list in `src/views/tabs/ProfilePage.vue`.
4. Add the code to `SUPPORTED_LANGUAGES` in `backend/src/services/profile.mapper.ts`.
5. Run `npx vitest run tests/unit/locales.spec.ts`.

## Local test sign-in

For development without SMS:

| Phone number | OTP | Notes |
| --- | --- | --- |
| `+91 1234567890` | `560142` | The seeded admin. No SMS is sent. |
| `+91 1234567891` | `560142` | The seeded member. |
| `+91 1234567892` | `560142` | The seeded Super Admin. |
| Any account in the database | `560142` | Accepted in local mode. A number with no account is refused. |

These work only when the backend runs with `NODE_ENV=development` or `USE_LOCAL_OTP=true`. The backend refuses them in production. The frontend accepts the two seeded numbers in the phone form so they can be submitted. The backend makes the final decision.

## Getting started

### Requirements

- Node.js 20 or later and npm (tested with Node 22.13)
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

Open http://localhost:5173/login. Enter `9876543210` or `1234567890` (the seeded admin), then enter `560142`. The backend console shows the local test login lines.

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite dev server on port 5173 |
| `npm run build` | Type-check with vue-tsc, then build for production |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint, the end-to-end type check, and Prettier in check mode |
| `npm run lint:fix` | Fix ESLint and Prettier issues where possible |
| `npm run typecheck:e2e` | Type-check the Playwright tests |
| `npm run test:unit` | Run the Vitest unit tests |
| `npm run test:unit:watch` | Run Vitest in watch mode |
| `npm run test:e2e` | Run the Playwright tests (starts a dev server on `E2E_PORT`, default 5173) |
| `npm test` | Run the unit tests, then the Playwright tests |

To run the browser tests against a backend on another port:

```bash
E2E_PORT=5174 VITE_API_BASE_URL=http://localhost:5077/api npx playwright test
```

## Testing

Unit tests live in `tests/unit/`. They use Vitest, Vue Test Utils, and `vi.mock` for the API. `tests/unit/setup.ts` installs the i18n plugin for every test. Ionic lifecycle hooks and `ion-modal` are stubbed, because they need the Ionic runtime.

| File | Covers |
| --- | --- |
| `LoginPage.spec.ts` | Phone validation, +91 normalisation, sending the OTP, navigation, server errors |
| `OtpBoxes.spec.ts` | Typing, auto-advance, backspace, paste, completion |
| `GroupCard.spec.ts` | Name, members, rupee formatting, status badges, next bid, Add Members event |
| `GroupsPage.spec.ts` | `+` opens the create-group dialog, Add Members opens it for the right group |
| `DuesPage.spec.ts` | Pending and paid lists, the mark-paid confirmation (method choice, API call), creating the month's dues |
| `InfoModal.spec.ts` | Dialog content, open and closed states, close button and custom label |
| `auth.store.spec.ts` | Requesting and verifying an OTP, failed verification, logout and data reset |
| `alerts.store.spec.ts` | Filtering, error handling, polling start and stop |
| `profile.store.spec.ts` | Language switch applied at once, saved, and reverted on failure |
| `api.service.spec.ts` | Endpoints and parameters, bearer header, error messages (Axios mocked) |
| `utils.spec.ts` | Phone, currency, time, bid-time, alert-day helpers |
| `superAdminResources.spec.ts` | Super Admin screen configuration (read-only views, role-permission rules) and the request-body rules (required fields, numbers, edit behaviour) |
| `locales.spec.ts` | Every locale has the English keys, the same placeholders, and no empty messages |

`jsdom` is pinned to 26.x. Newer versions need Node 22.22 or later.

End-to-end tests (`tests/e2e/`):
- `app.spec.ts`: a signed-out visitor is redirected to the sign-in screen.
- `dummy-login.spec.ts`: `1234567890` with OTP `560142` reaches the groups screen.

Playwright uses the `Mobile Chrome` device profile. Run `npx playwright install chromium` once on a new machine.

## Known limitations

- The access token is stored in `localStorage`. This is fine for the browser build, but not for a store release.
- Admin and member screens are separate. The Super Admin screens use English text only, and they have not been checked on a device.
- The dues screen records payments, but the app does not confirm them with a bank or UPI provider. The admin's entry is the record.

## Author

**Shailendra Pardeshi**
Senior Full Stack Developer
[LinkedIn](https://www.linkedin.com/in/shailendra-pardeshi-031596192) · shailendrapardeshi123@gmail.com
