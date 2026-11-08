import { Locator, Page } from '@playwright/test';

/**
 * Port of Java ElementActions. Playwright auto-waits for actionability, so there are no retry
 * wrappers. Instantiate per test: new ElementActions(page).
 */
export class ElementActions {
  constructor(private readonly page: Page) {}

  async click(element: Locator): Promise<void> {
    await element.click();
  }

  /** DOM click that bypasses actionability checks (overlays, etc.). Use sparingly. */
  async jsClick(element: Locator): Promise<void> {
    await element.evaluate('el => el.click()');
  }

  async doubleClick(element: Locator): Promise<void> {
    await element.dblclick();
  }

  async rightClick(element: Locator): Promise<void> {
    await element.click({ button: 'right' });
  }

  async clickLink(linkElement: Locator): Promise<void> {
    if (!linkElement) {
      throw new Error('Provided linkElement was null');
    }
    await linkElement.click();
  }

  async clearExistingTextValue(element: Locator): Promise<void> {
    await element.clear();
  }

  /** fill() already clears the field first. */
  async type(element: Locator, text: string): Promise<void> {
    await element.fill(text);
  }

  async typeAndPressEnter(element: Locator, text: string): Promise<void> {
    await element.fill(text);
    await element.press('Enter');
  }

  /** Key-by-key typing (what PLPHomePage.typeSearchQuery does) for inputs with debounce/onChange logic. */
  async typeSequentially(element: Locator, text: string, delayMs = 50): Promise<void> {
    await element.click();
    await element.fill('');
    await element.pressSequentially(text, { delay: delayMs });
  }

  async selectByVisibleText(element: Locator, text: string): Promise<void> {
    await element.selectOption({ label: text });
  }

  async selectByValue(element: Locator, value: string): Promise<void> {
    await element.selectOption({ value });
  }

  /** 0-based. Java silently ignored out-of-range indexes; Playwright throws, which is safer. */
  async selectByIndex(element: Locator, index: number): Promise<void> {
    await element.selectOption({ index });
  }

  async hover(element: Locator): Promise<void> {
    await element.hover();
  }

  async dragAndDrop(source: Locator, target: Locator): Promise<void> {
    await source.dragTo(target);
  }

  /**
   * Drags from the centre of the source by (xOffset, yOffset) pixels. The Java version moved the
   * mouse to the absolute coordinates (xOffset, yOffset), which was not a real offset; fixed here.
   */
  async dragAndDropByOffset(source: Locator, xOffset: number, yOffset: number): Promise<void> {
    const box = await source.boundingBox();
    if (!box) {
      throw new Error('Cannot drag: source element has no bounding box (not visible?)');
    }
    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;
    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();
    await this.page.mouse.move(startX + xOffset, startY + yOffset, { steps: 10 });
    await this.page.mouse.up();
  }

  /** Pass a path (or several) directly to the <input type=file>. */
  async uploadFile(fileInput: Locator, filePath: string | string[]): Promise<void> {
    await fileInput.setInputFiles(filePath);
  }
}
