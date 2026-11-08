import { Locator, Page } from '@playwright/test';

/**
 * Port of Java ConditionUtils: boolean "is it so right now?" probes that never throw.
 * These do NOT retry. For assertions that should retry use UiAssertionUtils / expect().
 */
export async function isElementDisplayed(locator: Locator): Promise<boolean> {
  return safe(() => locator.isVisible(), false);
}
export async function isElementVisible(page: Page, selector: string): Promise<boolean> {
  return safe(() => page.locator(selector).isVisible(), false);
}
export async function isElementHidden(locator: Locator): Promise<boolean> {
  return safe(() => locator.isHidden(), false);
}
export async function isElementEnabled(locator: Locator): Promise<boolean> {
  return safe(() => locator.isEnabled(), false);
}
export async function isElementSelected(locator: Locator): Promise<boolean> {
  return safe(() => locator.isChecked(), false);
}
export async function doesElementExist(page: Page, selector: string): Promise<boolean> {
  return safe(async () => (await page.locator(selector).count()) > 0, false);
}
export async function isTextPresentInElement(locator: Locator, expectedText: string): Promise<boolean> {
  return safe(async () => ((await locator.textContent()) ?? '').includes(expectedText), false);
}
export async function isTextPresentInPage(page: Page, text: string): Promise<boolean> {
  return safe(async () => (await page.content()).includes(text), false);
}
export async function getElementText(locator: Locator): Promise<string> {
  return safe(async () => ((await locator.textContent()) ?? '').trim(), '');
}
export async function hasAttributeValue(locator: Locator, attributeName: string, expectedValue: string): Promise<boolean> {
  return safe(async () => (await locator.getAttribute(attributeName)) === expectedValue, false);
}
export async function countElements(page: Page, selector: string): Promise<number> {
  return safe(() => page.locator(selector).count(), 0);
}
export async function waitForElementVisible(locator: Locator, timeoutMs: number): Promise<void> {
  await locator.waitFor({ state: 'visible', timeout: timeoutMs });
}
export async function waitForElementHidden(locator: Locator, timeoutMs: number): Promise<void> {
  await locator.waitFor({ state: 'hidden', timeout: timeoutMs });
}

async function safe<T>(probe: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await probe();
  } catch {
    return fallback;
  }
}
