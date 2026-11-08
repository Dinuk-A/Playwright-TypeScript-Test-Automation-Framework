import { APIRequestContext, test as base, expect } from '@playwright/test';
import { ApiClient } from '../utils/api/apiClient';
import { EvidenceLog } from '../utils/common/evidence';

interface FrameworkFixtures {
  /** Factory for an ApiClient against any base URL. Contexts are created per test and disposed automatically. */
  apiFor: (baseUrl: string) => Promise<ApiClient>;
  /** Per-test assertion evidence table; summary is attached automatically on teardown. */
  evidence: EvidenceLog;
}

/**
 * Replaces PlaywrightBaseTest / PWAPIBaseTest. Browser, context and page come from Playwright's
 * built-in fixtures (isolated per test and per worker), so no ThreadLocals or manual teardown.
 * Fixtures are lazy: a UI test never creates API contexts.
 */
export const test = base.extend<FrameworkFixtures>({
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
