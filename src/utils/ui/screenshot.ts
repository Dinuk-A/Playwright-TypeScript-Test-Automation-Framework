import { Locator, Page, test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../common/logger';

/** Port of Java ScreenCaptureUtils + attachment helpers. Failures log and return ''/undefined, like Java. */
export const SCREENSHOT_FOLDER = path.join(process.cwd(), 'screenshots');

const timestamp = (): string => new Date().toISOString().replace(/[-:T.Z]/g, '').replace(/^(\d{8})(\d{6})(\d+)$/, '$1_$2_$3');

function destination(namePrefix: string, suffix: string, extension = 'png'): string {
  fs.mkdirSync(SCREENSHOT_FOLDER, { recursive: true });
  return path.join(SCREENSHOT_FOLDER, `${namePrefix}${suffix}_${timestamp()}.${extension}`);
}

async function guarded<T>(label: string, fallback: T, action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch (error) {
    logger.error(`Failed to ${label}: ${(error as Error).message}`);
    return fallback;
  }
}

/** Convention: "[MODULE] Screenshot - [description] ([locale])", e.g. "FS01 Screenshot - Cleared Input (EN)". */
export function screenshotName(module: string, description: string, locale?: string): string {
  return `${module} Screenshot - ${description}${locale ? ` (${locale.toUpperCase()})` : ''}`;
}

// ---- to disk (return the absolute path, '' on failure)
export function takePageScreenshot(page: Page, namePrefix: string): Promise<string> {
  return guarded('take page screenshot', '', async () => {
    const dest = destination(namePrefix, '');
    await page.screenshot({ path: dest, fullPage: true });
    return dest;
  });
}

export function takeViewportScreenshot(page: Page, namePrefix: string): Promise<string> {
  return guarded('take viewport screenshot', '', async () => {
    const dest = destination(namePrefix, '_viewport');
    await page.screenshot({ path: dest, fullPage: false });
    return dest;
  });
}

export function takeElementScreenshot(locator: Locator, namePrefix: string): Promise<string> {
  return guarded('take element screenshot', '', async () => {
    const dest = destination(namePrefix, '_element');
    await locator.screenshot({ path: dest });
    return dest;
  });
}

/** `quality` only applies to jpeg (Playwright rejects it for png; Java passed it blindly). */
export function takePageScreenshotWithOptions(page: Page, namePrefix: string, quality: number, type: 'png' | 'jpeg'): Promise<string> {
  return guarded('take page screenshot with options', '', async () => {
    const dest = destination(namePrefix, '', type === 'jpeg' ? 'jpg' : 'png');
    await page.screenshot({ path: dest, fullPage: true, type, ...(type === 'jpeg' ? { quality } : {}) });
    return dest;
  });
}

export function takeClipRegionScreenshot(
  page: Page, namePrefix: string, x: number, y: number, width: number, height: number,
): Promise<string> {
  return guarded('take clip region screenshot', '', async () => {
    const dest = destination(namePrefix, '_clip');
    await page.screenshot({ path: dest, clip: { x, y, width, height } });
    return dest;
  });
}

export function takeScreenshotWithMask(page: Page, namePrefix: string, maskLocator: Locator): Promise<string> {
  return guarded('take screenshot with mask', '', async () => {
    const dest = destination(namePrefix, '_masked');
    await page.screenshot({ path: dest, fullPage: true, mask: [maskLocator] });
    return dest;
  });
}

/** Chromium only; works in headless mode. */
export function takePagePdf(page: Page, namePrefix: string): Promise<string> {
  return guarded('take page PDF', '', async () => {
    const dest = destination(namePrefix, '', 'pdf');
    await page.pdf({ path: dest });
    return dest;
  });
}

// ---- in memory
export function takePageScreenshotAsBytes(page: Page): Promise<Buffer | undefined> {
  return guarded('take page screenshot as bytes', undefined, () => page.screenshot({ fullPage: true }));
}

export function takeViewportScreenshotAsBytes(page: Page): Promise<Buffer | undefined> {
  return guarded('take viewport screenshot as bytes', undefined, () => page.screenshot({ fullPage: false }));
}

export function takeElementScreenshotAsBytes(locator: Locator): Promise<Buffer | undefined> {
  return guarded('take element screenshot as bytes', undefined, () => locator.screenshot());
}

export async function takePageScreenshotAsBase64(page: Page): Promise<string | undefined> {
  const bytes = await takePageScreenshotAsBytes(page);
  return bytes && bytes.length > 0 ? bytes.toString('base64') : undefined;
}

/** Used by EvidenceLog. */
export const captureScreenshot = takePageScreenshotAsBytes;

// ---- helpers
export function compareScreenshots(path1: string, path2: string): boolean {
  try {
    return fs.readFileSync(path1).equals(fs.readFileSync(path2));
  } catch (error) {
    logger.error(`Failed to compare screenshots: ${(error as Error).message}`);
    return false;
  }
}

export function initializeScreenshotFolder(): void {
  fs.mkdirSync(SCREENSHOT_FOLDER, { recursive: true });
}

/** Attach to the current test's Allure report. */
export async function attachScreenshot(page: Page, name: string): Promise<void> {
  const body = await takePageScreenshotAsBytes(page);
  if (body) {
    await test.info().attach(name, { body, contentType: 'image/png' });
  }
}
