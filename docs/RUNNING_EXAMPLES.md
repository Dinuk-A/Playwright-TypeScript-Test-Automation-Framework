# Running the example tests

Examples (framework demo, safe to delete later):
- API: `src/tests/api/practice/jsonplaceholder.spec.ts` (jsonplaceholder.typicode.com)
- UI:  `src/tests/ui/practice/the-internet.spec.ts` (the-internet.herokuapp.com)
- POMs: `src/pages/practice/theInternet.ts`; URLs: `practice` section of `src/config/environments/dev.json`

No `.env` or token is needed for these.

## One-time setup (PowerShell, from the project root)
```powershell
Expand-Archive .\ts-taf-additions.zip -DestinationPath . -Force
Copy-Item .\ts-taf-additions\* . -Recurse -Force      # merges new folders/files; nothing existing is overwritten
Remove-Item .\ts-taf-additions -Recurse -Force
npm ci
npx playwright install chromium
```

## Run
```powershell
# API examples (no browser is launched)
npx playwright test src/tests/api/practice --project=chromium

# UI examples
npx playwright test src/tests/ui/practice --project=chromium

# watch the browser / step through / UI mode
npx playwright test src/tests/ui/practice --project=chromium --headed
npx playwright test src/tests/ui/practice --project=chromium --debug
npx playwright test src/tests/ui/practice --project=chromium --ui

# one test, or by tag
npx playwright test --project=chromium -g "TC-HRK-001"
npx playwright test --project=chromium --grep "@api"

# everything under practice, in all three configured browsers (3x the runs)
npx playwright test src/tests/api/practice src/tests/ui/practice
```
Always add `--project=chromium` unless you want Firefox and WebKit too (the existing config runs all three).

## Reports
```powershell
npx playwright show-report                     # Playwright HTML report (the current config's reporter)

# Allure, without editing playwright.config.ts (CLI reporter override):
npx playwright test src/tests/api/practice --project=chromium --reporter=html,allure-playwright
npx allure generate ./allure-results --clean -o ./allure-report
npx allure open ./allure-report
```
`npm run allure:report` only works once the Allure CLI is installed (see RECOMMENDED_CONFIG_CHANGES.md).

## Notes
- Both sites are public and shared: they can be slow or briefly down. A network failure on all tests means the site, not the framework.
- JSONPlaceholder never persists writes; POST always returns id 101, which TC-JPH-005 relies on.
- `npx playwright test --list` shows discovered tests without running them.
