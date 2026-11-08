import { Locator } from '@playwright/test';

/**
 * Port of Java RetrievalUtils. Errors propagate (Java logged and returned null, which turned
 * locator problems into NullPointerExceptions later). Missing text/attributes return ''.
 */
export type BoundingBox = { x: number; y: number; width: number; height: number };

export async function getElementText(locator: Locator): Promise<string> {
  return (await locator.textContent()) ?? '';
}

export async function getTrimmedText(locator: Locator): Promise<string> {
  return ((await locator.textContent()) ?? '').trim();
}

export async function getAttribute(locator: Locator, attributeName: string): Promise<string> {
  return (await locator.getAttribute(attributeName)) ?? '';
}

export async function getInputValue(locator: Locator): Promise<string> {
  return locator.inputValue();
}

export async function getCssValue(locator: Locator, cssProperty: string): Promise<string> {
  return locator.evaluate('(el, prop) => window.getComputedStyle(el).getPropertyValue(prop)', cssProperty);
}

export async function getTagName(locator: Locator): Promise<string> {
  return locator.evaluate('el => el.tagName.toLowerCase()');
}

export async function getLocation(locator: Locator): Promise<BoundingBox | null> {
  return locator.boundingBox();
}

export async function getLocationString(locator: Locator): Promise<string | null> {
  const box = await locator.boundingBox();
  return box ? JSON.stringify(box) : null;
}

export async function getLinkText(locator: Locator): Promise<string> {
  return getTrimmedText(locator);
}

export async function getLinkHref(locator: Locator): Promise<string> {
  return getAttribute(locator, 'href');
}
