import { APIRequestContext, test as base, expect } from '@playwright/test';
import { env } from '../config/env';
import { ApiClient } from '../utils/api/apiClient';
import { EvidenceLog } from '../utils/common/evidence';

interface FrameworkFixtures {
  /** Product API (search / by-id / categories). Fresh context per test. */
  productApi: ApiClient;
  /** Cart API (MyCart, items, discount code, shipping methods). Fresh context per test. */
  cartApi: ApiClient;
  /** Factory for an ApiClient against any base URL (used by the practice examples). Contexts are disposed automatically. */
  apiFor: (baseUrl: string) => Promise<ApiClient>;
  /** Per-test assertion evidence table; summary is attached automatically on teardown. */
  evidence: EvidenceLog;
}

/**
 * Replaces PlaywrightBaseTest / PWAPIBaseTest. Browser, context and page come from Playwright's
 * built-in fixtures (isolated per test and per worker), so no ThreadLocals or manual teardown.
 * Fixtures are lazy: a UI test never creates API contexts, and a UI-only run never needs ECOS_AUTH_TOKEN.
 */
export const test = base.extend<FrameworkFixtures>({
  productApi: async ({ playwright }, use) => {
    const context = await playwright.request.newContext({
      baseURL: env.api.productBaseUrl,
      extraHTTPHeaders: { Accept: 'application/json' },
    });
    await use(new ApiClient(context, env.api.productBaseUrl));
    await context.dispose();
  },

  cartApi: async ({ playwright }, use) => {
    const context = await playwright.request.newContext({
      baseURL: env.api.cartBaseUrl,
      extraHTTPHeaders: { Accept: 'application/json' },
    });
    await use(new ApiClient(context, env.api.cartBaseUrl));
    await context.dispose();
  },

  apiFor: async ({ playwright }, use) => {
    const contexts: APIRequestContext[] = [];
    await use(async (baseUrl: string) => {
      const context = await playwright.request.newContext({
        baseURL: baseUrl,
        extraHTTPHeaders: { Accept: 'application/json' },
      });
      contexts.push(context);
      return new ApiClient(context, baseUrl);
    });
    await Promise.all(contexts.map((c) => c.dispose()));
  },

  // eslint-disable-next-line no-empty-pattern
  evidence: async ({}, use) => {
    const log = new EvidenceLog();
    await use(log);
    await log.attachSummary();
  },
});

export { expect };
