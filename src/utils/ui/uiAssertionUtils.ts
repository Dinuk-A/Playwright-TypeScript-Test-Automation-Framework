import { expect, Locator, Page } from '@playwright/test';
import { classTokenRegExp, escapeRegExp } from '../common/regex';

/**
 * Port of Java UiAssertionUtils (Playwright version). Same method names and failure messages, but
 * every locator assertion is a retrying web-first expect() (Java's isVisible()/getText() asserts
 * were one-shot). Wrap calls in evidence.assertStep(...) when you want them in the evidence table.
 */
export async function assertElementVisible(locator: Locator): Promise<void> {
  await expect(locator, 'Element is not visible on the page.').toBeVisible();
}

export async function assertElementNotVisible(locator: Locator): Promise<void> {
  await expect(locator, 'Element is visible, but expected to be hidden.').toBeHidden();
}

export async function assertElementEnabled(locator: Locator): Promise<void> {
  await expect(locator, 'Element is not enabled.').toBeEnabled();
}

export async function assertElementDisabled(locator: Locator): Promise<void> {
  await expect(locator, 'Element is enabled, but it should be disabled.').toBeDisabled();
}

export async function assertElementTextEquals(locator: Locator, expectedText: string): Promise<void> {
  await expect(locator, 'Element text does not match.').toHaveText(expectedText.trim());
}

export async function assertElementContainsText(locator: Locator, partialText: string): Promise<void> {
  await expect(locator, `Element does not contain expected partial text: '${partialText}'.`).toContainText(partialText);
}

/** Visible and non-blank text. */
export async function assertElementHasText(locator: Locator): Promise<void> {
  await expect(locator, 'Element is not visible.').toBeVisible();
  await expect(locator, 'Element is visible but contains no text.').not.toHaveText(/^\s*$/);
}

export async function assertPageTitle(page: Page, expectedTitle: string): Promise<void> {
  await expect(page, 'Page title does not match.').toHaveTitle(expectedTitle);
}

export async function assertPageTitleNot(page: Page, unexpectedTitle: string): Promise<void> {
  await expect(page, 'Page title unexpectedly matches.').not.toHaveTitle(unexpectedTitle);
}

export function assertTextEquals(actual: string, expected: string): void {
  expect(actual, 'Text values do not match.').toBe(expected);
}

export async function assertUrlContains(page: Page, expectedPartialUrl: string): Promise<void> {
  await expect(page, `Expected URL to contain: ${expectedPartialUrl}`).toHaveURL(new RegExp(escapeRegExp(expectedPartialUrl)));
}

export async function assertUrlEquals(page: Page, expectedUrl: string): Promise<void> {
  await expect(page, `Expected URL to be exactly: ${expectedUrl}`).toHaveURL(expectedUrl);
}

/** In the DOM (may be hidden). */
export async function assertElementExists(locator: Locator): Promise<void> {
  await expect(locator.first(), 'Element does not exist in the DOM.').toBeAttached();
}

export async function assertElementNotExists(locator: Locator): Promise<void> {
  await expect(locator, 'Element exists in the DOM, but should not.').toHaveCount(0);
}

export async function assertElementChecked(locator: Locator): Promise<void> {
  await expect(locator, 'Element is not checked.').toBeChecked();
}

export async function assertElementNotChecked(locator: Locator): Promise<void> {
  await expect(locator, 'Element is checked, but should be unchecked.').not.toBeChecked();
}

export async function assertAttributeEquals(locator: Locator, attributeName: string, expectedValue: string): Promise<void> {
  await expect(locator, `Attribute '${attributeName}' does not match.`).toHaveAttribute(attributeName, expectedValue);
}

export async function assertAttributeContains(locator: Locator, attributeName: string, partialValue: string): Promise<void> {
  await expect(locator, `Attribute '${attributeName}' does not contain '${partialValue}'.`)
    .toHaveAttribute(attributeName, new RegExp(escapeRegExp(partialValue)));
}

/** Class-token match (Java used a substring match, so "btn" would wrongly pass for "btn-primary"). */
export async function assertHasClass(locator: Locator, className: string): Promise<void> {
  await expect(locator, `Element does not have class '${className}'.`).toHaveClass(classTokenRegExp(className));
}

export async function assertNotHasClass(locator: Locator, className: string): Promise<void> {
  await expect(locator, `Element has class '${className}', but should not.`).not.toHaveClass(classTokenRegExp(className));
}

export async function assertPlaceholder(locator: Locator, expectedPlaceholder: string): Promise<void> {
  await expect(locator, 'Placeholder text does not match.').toHaveAttribute('placeholder', expectedPlaceholder);
}

export async function assertInputValue(locator: Locator, expectedValue: string): Promise<void> {
  await expect(locator, 'Input value does not match.').toHaveValue(expectedValue);
}

export async function assertElementCount(locator: Locator, expectedCount: number): Promise<void> {
  await expect(locator, 'Element count does not match.').toHaveCount(expectedCount);
}

/** Raw HTML contains the text (same semantics as Java page.content()), retried until timeout. */
export async function assertPageContainsText(page: Page, expectedText: string): Promise<void> {
  await expect.poll(() => page.content(), { message: `Page does not contain expected text: '${expectedText}'` }).toContain(expectedText);
}

export async function assertPageNotContainsText(page: Page, unexpectedText: string): Promise<void> {
  await expect.poll(() => page.content(), { message: `Page contains unexpected text: '${unexpectedText}'` }).not.toContain(unexpectedText);
}
