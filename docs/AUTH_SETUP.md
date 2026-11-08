# Auth setup (Auth0 login once, reuse everywhere)

## What it does
`src/setup/auth.setup.ts` (project `setup`) logs in through Auth0 with `Auth0LoginPage`, then writes:
- `.auth/user.json`  - browser storage state, reused by UI tests tagged `@auth`
- `.auth/token.json` - the API bearer token, read by `env.authToken` (replaces the pasted JWT in ecos.properties)

If the stored token still has more than 10 minutes left, the login is skipped. `ECOS_AUTH_TOKEN` (env var) always wins when set.

## Credentials
Copy `.env.example` to `.env` and fill `ECOS_TEST_USER_EMAIL` and `ECOS_TEST_USER_PASSWORD`. In CI use repository secrets.
Add `.env` and `.auth/` to `.gitignore`.

## How the token is obtained (ASSUMPTIONS - verify on the first run)
1. Default: the setup listens to browser traffic and takes the first `Authorization: Bearer ...` sent to the cart or product API base URL. This works only if the browser calls those APIs directly.
2. If the app calls the APIs from the Next.js server instead, the listener times out with a clear message. Then set `ECOS_TOKEN_ENDPOINT` to an app path that returns the token as JSON (for the Auth0 Next.js SDK that is typically `/auth/access-token` (v4) or `/api/auth/token` (v3)).
3. The sign-in button locator `header button[aria-label='Sign in']` is copied from Java `PLPHomePage` (English label; setup always starts on the default locale).
4. Auth0 locators are the unchanged Java ones (ids / data-* attributes).

## playwright.config.ts changes (NOT applied; your config file is untouched)
```ts
import { defineConfig, devices } from '@playwright/test';
import { env } from './src/config/env';
import { STORAGE_STATE_PATH } from './src/utils/api/authSession';

export default defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['allure-playwright', { resultsDir: 'allure-results' }]],
  use: { baseURL: env.ui.baseUrl, trace: 'on-first-retry', screenshot: 'only-on-failure' },
  projects: [
    // 1. login once
    { name: 'setup', testDir: './src/setup', testMatch: /.*\.setup\.ts/ },

    // 2. Heimerle API tests (need the token)
    { name: 'heimerle-api', testDir: './src/tests/api/heimerle_meule', dependencies: ['setup'] },

    // 3. Heimerle UI: anonymous by default, logged-in only for tests tagged @auth
    { name: 'heimerle-ui', testDir: './src/tests/ui/heimerle_meule', grepInvert: /@auth/,
      use: { ...devices['Desktop Chrome'] } },
    { name: 'heimerle-ui-auth', testDir: './src/tests/ui/heimerle_meule', grep: /@auth/, dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], storageState: STORAGE_STATE_PATH } },

    // 4. public practice examples (no login, no credentials)
    { name: 'practice', testDir: './src/tests', testMatch: /practice\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] } },
  ],
});
```
With this config the earlier `--project=chromium` examples become `--project=practice`.

## Run
```powershell
npx playwright test --project=setup                 # login + capture token only
npx playwright test --project=heimerle-api          # runs setup first, then the cart specs
npx playwright test --project=heimerle-api --no-deps   # reuse the stored token, skip setup
npx playwright test --project=practice              # examples, no credentials needed
```
Tag a UI test with `{ tag: '@auth' }` to run it logged in.

## Models
`src/models/` holds the response types (`Cart`, `ProductSearchResponse`, `Facet`, error shapes). Use `getResponseAsJson<Cart>(response)`.
