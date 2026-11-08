# TypeScript TAF architecture

Same architectural intent as the Java TAF (TAF-ECOSS, `heimerle_meule`), expressed with Playwright Test idioms.
Not a line-by-line port: where Playwright already provides a mechanism, that mechanism is used.

## Layers and where things go

| Folder | Responsibility | Java equivalent |
|---|---|---|
| `src/config/` | Typed environment config. Non-secret values in `environments/<TEST_ENV>.json`, secrets from env vars / `.env`. Never hardcode URLs, tenants, tokens or endpoints. | `ConfigPropertyReader`, `configs/ecos.properties` |
| `src/fixtures/` | The single `test` / `expect` export every spec imports. Provides `productApi`, `cartApi`, `evidence` (and later page-object fixtures). | `PlaywrightBaseTest`, `PWAPIBaseTest` |
| `src/pages/heimerle_meule/` | Page objects, composition only (PDP -> PDPGallery / PDPAccordionSection ...; PLPHomePage -> PLPCard). Locale-independent locators. | `ui_pages.playwright.heimerle_meule` |
| `src/tests/ui/heimerle_meule/` | UI specs (`US_FS01.spec.ts`, `TC-FS01-001` in titles). Only `test()` blocks, data arrays and fixtures. | `ecos.heimerle_meule.ui_tests` |
| `src/tests/api/heimerle_meule/` | API specs, one file per endpoint family. | `api_tests.*` |
| `src/tests/e2e/heimerle_meule/` | Cross-feature journeys (search -> PDP -> cart -> checkout). | none yet |
| `src/utils/api/` | `ApiClient`, `headers.ts`, `apiAssertions.ts`, `responseHelpers.ts`; per-endpoint helper modules go here (`productsSearch.ts`, `cart.ts`, ...). | `PWAPIUtils`, `PWAssertionUtils`, `PWResponseHelpers`, `*ApiTestUtils` |
| `src/utils/ui/` | Ported Playwright utils (see catalogue below); flow helpers go here too (`plp.ts`, `pdp.ts`, `nav.ts`). | `utils.ui.playwright.*`, `PLP_Utils`, `PDP_Utils`, `US_NAV_Utils` |
| `src/utils/common/` | `evidence`, `guards`, `locale`, `logger`, `jsonReader`, `jsonSaveToFile`, `jsonUtils`, `jsonPath`, `streamFilter`, `httpStatusCode`, `allureAttachments`, `regex`. | `AllureEvidenceLogger`, `JsonReader`, `JsonSaveToFile`, `JsonUtils`, `StreamFilter`, `HttpStatusCode`, `AllureLogger` (generic parts) |
| `src/data/api/heimerle_meule/` | API test data and JSON schemas (`cart_response_schema.json`). | `src/test/resources/data/api` |
| `src/data/ui/heimerle_meule/` | UI test data (`category_tree.json`, `search_results_sample.json`). | `src/test/resources/data/ui` |
| `allure-results/`, `playwright-report/` | Generated output only. Never edited or committed. | same |

## Conventions carried over from Java
1. Locale independence: no translated text or localized aria-labels in locators/assertions; labels are read from the page or passed in.
2. Specs contain only tests, data providers (plain arrays) and fixtures; helper logic lives in `src/utils`.
3. Readiness: no network-idle; use `waitForPageFullyLoaded` and web-first `expect`.
4. Vacuous-truth guard: call `assertExercised(count, what)` before loop-based assertions.
5. Evidence: `await evidence.assertStep(name, page, () => expect(...))`; the HTML summary attaches itself on teardown.
6. API: `ApiClient` per test via fixtures (never static); bodies pretty-printed; Authorization masked.
7. Dynamic category/product IDs resolved at runtime, not hardcoded.
8. `data-slot` identifies a component type, not an instance: still use `.nth(index)`.
9. Headless PDF links with `target=_blank` can fire `download` instead of `page`: use `Promise.race` on both events.
10. Pinned "current behaviour" assertions (e.g. the 500 for injection with valid pagination) stay clearly commented.

## Test naming and tagging
- File: `US_FS01.spec.ts`; title: `TC-FS01-001 Verify search input field renders and accepts text input`.
- Allure metadata from `allure-playwright` (installed): use `test.info().annotations` / tags in titles (`@smoke`, `@happyPath`) and run subsets with `--grep`. This replaces TestNG `groups` and suite XML files.

## Example usage
```ts
import { test, expect } from '../../../fixtures';
import { env } from '../../../config/env';
import { authHeaders } from '../../../utils/api/headers';

test('TC-CART-001 cart returns 200', async ({ cartApi }) => {
  const res = await cartApi.get(env.endpoints.cart, {
    headers: authHeaders(env.tenants.hm),
    params: { language: 'en' },
  });
  expect(res.status()).toBe(200);
});
```

## Reusable utility catalogue (Java -> TS)

Same names where possible so Java and TS read alike. Differences are deliberate and listed.

| Java | TypeScript | Notes |
|---|---|---|
| `ElementActions` | `utils/ui/elementActions.ts` (`class ElementActions(page)`) | + `typeSequentially`. `dragAndDropByOffset` now offsets from the element centre (Java moved to absolute coordinates). `selectBy*` use label/value/index options. |
| `BrowserUtils` | `utils/ui/browserUtils.ts` (functions) | `waitForNewPage` uses `waitForEvent('page')`. |
| `TabActions` | `utils/ui/tabActions.ts` (`class TabActions(page, context)`) | Throws instead of returning null. + `waitForNewTabOrDownload` for convention #9. |
| `IframeActions` | `utils/ui/iframeActions.ts` | Returns `FrameLocator`s. No switchToDefaultContent/ParentFrame (no frame state in Playwright). |
| `PopupActions` | `utils/ui/popupActions.ts` | Same methods. |
| `RetrievalUtils` | `utils/ui/retrievalUtils.ts` | Errors propagate; missing values return ''. |
| `ConditionUtils` | `utils/ui/conditionUtils.ts` | Non-throwing, non-retrying probes. |
| `WaitUtils` | `utils/ui/waitUtils.ts` | Same names; built on `waitFor` / web-first `expect`. `waitForDialog` returns the dialog. `waitForPageFullyLoaded` kept. |
| `UiAssertionUtils` | `utils/ui/uiAssertionUtils.ts` | Same names, retrying assertions. `assertHasClass` matches class tokens, not substrings. |
| `ScreenCaptureUtils` | `utils/ui/screenshot.ts` | Same capture set incl. clip/mask/pdf/compare; `quality` only for jpeg. |
| `AllureEvidenceLogger` | `utils/common/evidence.ts` | Fixture-managed lifecycle. |
| `PWAPIUtils` | `utils/api/apiClient.ts` + `headers.ts` | One generic `get/post/put/patch/delete(path, {headers, params, data})`; the ~30 overloads collapse into it. Auth variants are header builders: `bearerHeaders`, `basicAuthHeaders`, `apiKeyHeaders`, `cookieHeaders`. Java `getWithBearerToken` omitted the space after "Bearer"; fixed. |
| `PWAssertionUtils` | `utils/api/apiAssertions.ts` | JSON paths via `common/jsonPath.ts` (dot/bracket only, no Groovy functions). |
| `PWResponseHelpers` | `utils/api/responseHelpers.ts` | `closeApiContext` replaced by fixture disposal. |
| `PWAPIBaseTest` / `PlaywrightBaseTest` | `fixtures/index.ts` | |
| `ConfigPropertyReader` | `config/env.ts` | |
| `JsonReader` | `utils/common/jsonReader.ts` | + `fetchJsonValueByPath` (used by US_NAV_Utils but missing in the uploaded Java file). |
| `JsonSaveToFile`, `JsonUtils`, `StreamFilter`, `HttpStatusCode` | `utils/common/*.ts` | Direct ports. |
| `AllureLogger` | `utils/common/allureAttachments.ts` + `ApiClient` | Request/response logging is in `ApiClient`; the generic attachers are ported. |
| `SchemaValidationUtils` | not yet | Needs `ajv` (not installed). |
| `StreamReaderUtils`, RestAssured `ApiUtils`/`AssertionUtils`/`ResponseHelpers`, Selenium classes | not ported | RestAssured/Selenium specific. |
