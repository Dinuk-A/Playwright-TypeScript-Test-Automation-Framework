import { Dialog, expect, Locator, Page } from '@playwright/test';
import { classTokenRegExp } from '../common/regex';
import { logger } from '../common/logger';

/**
 * Port of Java WaitUtils. Same method names, but built on Playwright's own retrying primitives
 * (locator.waitFor, web-first expect, page.waitForURL) instead of Thread.sleep polling loops.
 * All timeouts are in milliseconds; DEFAULT_TIMEOUT matches the Java 10s default.
 */
export const DEFAULT_TIMEOUT = 10_000;
const PAGE_LOAD_TIMEOUT = 30_000;

// ------------------------------------------------------------------ visibility / presence
export async function waitForElementVisible(locator: Locator, timeoutMs = DEFAULT_TIMEOUT): Promise<Locator> {
  await locator.waitFor({ state: 'visible', timeout: timeoutMs });
  return locator;
}

export async function waitForElementClickable(locator: Locator, timeoutMs = DEFAULT_TIMEOUT): Promise<Locator> {
  await locator.waitFor({ state: 'visible', timeout: timeoutMs });
  await expect(locator).toBeEnabled({ timeout: timeoutMs });
  return locator;
}

/** In the DOM, not necessarily visible. */
export async function waitForElementPresence(locator: Locator, timeoutMs = DEFAULT_TIMEOUT): Promise<Locator> {
  await locator.first().waitFor({ state: 'attached', timeout: timeoutMs });
  return locator;
}

export async function waitForElementHidden(locator: Locator, timeoutMs = DEFAULT_TIMEOUT): Promise<Locator> {
  await locator.waitFor({ state: 'hidden', timeout: timeoutMs });
  return locator;
}

// ------------------------------------------------------------------ text
export async function waitForTextInElement(locator: Locator, expectedText: string, timeoutMs = DEFAULT_TIMEOUT): Promise<boolean> {
  await expect(locator).toContainText(expectedText, { timeout: timeoutMs });
  return true;
}

export async function waitForElementTextEquals(locator: Locator, expectedText: string, timeoutMs = DEFAULT_TIMEOUT): Promise<boolean> {
  await expect(locator).toHaveText(expectedText.trim(), { timeout: timeoutMs });
  return true;
}

// ------------------------------------------------------------------ dialog
/** Resolves with the dialog that appears (the Java version returned nothing and leaked a handler). */
export async function waitForDialog(page: Page, timeoutMs = DEFAULT_TIMEOUT): Promise<Dialog> {
  return page.waitForEvent('dialog', { timeout: timeoutMs });
}

// ------------------------------------------------------------------ url
export async function waitForUrlContains(page: Page, partialUrl: string, timeoutMs = DEFAULT_TIMEOUT): Promise<void> {
  await page.waitForURL((url) => url.href.includes(partialUrl), { timeout: timeoutMs });
}

export async function waitForUrlEquals(page: Page, expectedUrl: string, timeoutMs = DEFAULT_TIMEOUT): Promise<void> {
  await page.waitForURL((url) => url.href === expectedUrl, { timeout: timeoutMs });
}

// ------------------------------------------------------------------ page lifecycle
export async function waitForPageLoad(page: Page, timeoutMs = PAGE_LOAD_TIMEOUT): Promise<void> {
  await page.waitForLoadState('load', { timeout: timeoutMs });
}

/** Kept for parity. Convention #4: unreliable on dev, prefer waitForPageFullyLoaded or element waits. */
export async function waitForNetworkIdle(page: Page, timeoutMs = PAGE_LOAD_TIMEOUT): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout: timeoutMs });
}

// ------------------------------------------------------------------ attributes / state
export async function waitForAttributeValue(locator: Locator, attributeName: string, expectedValue: string, timeoutMs = DEFAULT_TIMEOUT): Promise<boolean> {
  await expect(locator).toHaveAttribute(attributeName, expectedValue, { timeout: timeoutMs });
  return true;
}

export async function waitForElementHasClass(locator: Locator, className: string, timeoutMs = DEFAULT_TIMEOUT): Promise<boolean> {
  await expect(locator).toHaveClass(classTokenRegExp(className), { timeout: timeoutMs });
  return true;
}

export async function waitForElementChecked(locator: Locator, timeoutMs = DEFAULT_TIMEOUT): Promise<boolean> {
  await expect(locator).toBeChecked({ timeout: timeoutMs });
  return true;
}

export async function waitForElementCount(locator: Locator, expectedCount: number, timeoutMs = DEFAULT_TIMEOUT): Promise<void> {
  await expect(locator).toHaveCount(expectedCount, { timeout: timeoutMs });
}

// ------------------------------------------------------------------ composite "page is settled"
/**
 * Waits, deterministically, until the page is finished rendering before evidence is captured:
 * load event, aria-busy cleared, lazy images triggered and complete, then two animation frames
 * (replaces the fixed 300ms buffer). Each stage is independently timed out and logged, never fatal,
 * because it only affects evidence quality. No network-idle wait (convention #4).
 * Page functions are strings because tsconfig has no DOM lib.
 */
export async function waitForPageFullyLoaded(page: Page, timeoutMs = 15_000): Promise<void> {
  const soft = async (stage: string, action: () => Promise<unknown>): Promise<void> => {
    try {
      await action();
    } catch (error) {
      logger.warn(`[waitForPageFullyLoaded] ${stage} not satisfied within ${timeoutMs}ms: ${(error as Error).message}`);
    }
  };

  await soft('load event', () => page.waitForLoadState('load', { timeout: timeoutMs }));
  await soft('aria-busy cleared', () =>
    page.waitForFunction('!document.querySelector(\'[aria-busy="true"]\')', undefined, { timeout: timeoutMs }),
  );
  await soft('lazy images triggered', () =>
    page.evaluate('window.scrollTo(0, document.body.scrollHeight); window.scrollTo(0, 0);'),
  );
  await soft('images complete', () =>
    page.waitForFunction('Array.from(document.images).every(img => img.complete)', undefined, { timeout: timeoutMs }),
  );
  await soft('render settled', () =>
    page.evaluate('new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))'),
  );
}
