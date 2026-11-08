import { BrowserContext, Page } from '@playwright/test';

/** Port of Java BrowserUtils (Playwright flavour). */
export async function openUrl(page: Page, url: string): Promise<void> {
  await page.goto(url);
}
export async function goBack(page: Page): Promise<void> {
  await page.goBack();
}
export async function goForward(page: Page): Promise<void> {
  await page.goForward();
}
export async function refreshPage(page: Page): Promise<void> {
  await page.reload();
}
export function getCurrentUrl(page: Page): string {
  return page.url();
}
export async function getPageTitle(page: Page): Promise<string> {
  return page.title();
}
export async function maximizeWindow(page: Page): Promise<void> {
  await page.setViewportSize({ width: 1920, height: 1080 });
}
export async function fullscreenWindow(page: Page): Promise<void> {
  await page.setViewportSize({ width: 1920, height: 1440 });
}
export async function switchToWindowByIndex(context: BrowserContext, index: number): Promise<void> {
  const pages = context.pages();
  if (index >= 0 && index < pages.length) {
    await pages[index].bringToFront();
  }
}
export function getAllPages(context: BrowserContext): Page[] {
  return context.pages();
}
export function getCurrentPage(context: BrowserContext): Page | undefined {
  return context.pages()[0];
}
export function getWindowCount(context: BrowserContext): number {
  return context.pages().length;
}
export async function closePage(page: Page): Promise<void> {
  await page.close();
}

/**
 * Runs `action` (e.g. clicking a target=_blank link) and returns the page it opened.
 * For links that may trigger a file download instead, use TabActions.waitForNewTabOrDownload.
 */
export async function waitForNewPage(context: BrowserContext, action: () => Promise<void>): Promise<Page> {
  const [newPage] = await Promise.all([context.waitForEvent('page'), action()]);
  return newPage;
}
