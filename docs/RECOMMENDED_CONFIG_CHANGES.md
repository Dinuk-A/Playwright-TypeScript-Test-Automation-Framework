# Recommended changes to existing files (NOT applied)

## playwright.config.ts
1. **Allure is not wired.** `allure-playwright` is installed but `reporter: 'html'` means `allure-results/` never fills.
   `reporter: [['html'], ['allure-playwright', { resultsDir: 'allure-results' }]]`
2. Base URL and timeouts from config: `use: { baseURL: env.ui.baseUrl, screenshot: 'only-on-failure', actionTimeout: 15_000 }`, `timeout: 60_000`, `expect: { timeout: 10_000 }` (`import { env } from './src/config/env'`).
3. Split projects so API specs do not launch every browser: `api` (no device, `testDir` api), `ui-chromium` (default), firefox/webkit opt-in. Replaces the Java `browser` / `headless` TestNG parameters (`--project`, `--headed`).
4. `retries: 0` locally is fine; keep `trace: 'on-first-retry'`; consider `video: 'retain-on-failure'`.

## package.json
- Add scripts: `"typecheck": "tsc --noEmit"`, `"test:ui": "playwright test --project=ui-chromium"`, `"test:api": "playwright test --project=api"`.
- `allure:report` / `allure:open` call the `allure` CLI, which is not in devDependencies. Add the Allure CLI or run it via `npx`.
- Future dependency (when porting `SchemaValidationUtils`): `ajv` (+ `ajv-formats`) for JSON-schema validation. Not needed for this structure.

## tsconfig.json
- Page callbacks written as arrow functions touching `document`/`window` need `"lib": ["ES2020", "DOM"]`. The new code avoids this by passing strings to `waitForFunction`/`evaluate`.
- `rootDir: ./src` excludes `playwright.config.ts`; fine for Playwright, but `tsc` will not typecheck the config. Optionally add a second tsconfig for it.
- Optional path aliases (`@config/*`, `@utils/*`, `@pages/*`); Playwright honours `paths`.

## .gitignore
- Add `.env`, `screenshots/`, `allure-results/`, `allure-report/`, `playwright-report/`, `test-results/` if missing.

## .github/workflows/playwright.yml
- Provide `ECOS_AUTH_TOKEN` from repository secrets (`env:`), set `TEST_ENV`.
- Upload `allure-results/` as an artifact next to `playwright-report/`.
- Installs all browsers with `--with-deps`; restrict to `chromium` unless cross-browser runs are required.
- Dev environment is behind `devk8s.hm-pm.net`: confirm GitHub-hosted runners can reach it, otherwise a self-hosted runner is needed.
- Java side: Jenkins; this workflow is the GitHub equivalent, decide which is the source of truth.

## Security note
The Java `ecos.properties` contains a pasted JWT (with a real email). It was not copied. Consider removing it from the file and from git history, and rotating if it was ever valid outside dev.
