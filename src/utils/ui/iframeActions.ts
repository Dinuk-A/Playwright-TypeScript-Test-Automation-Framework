import { FrameLocator, Locator, Page } from '@playwright/test';

/**
 * Port of Java IframeActions. Playwright has no "switch to frame" state: you get a FrameLocator
 * and chain from it, so switchToDefaultContent / switchToParentFrame are intentionally not ported
 * (just keep using `page`, or the parent FrameLocator).
 */
export class IframeActions {
  constructor(private readonly page: Page) {}

  /** 0-based. (Java used an nth-child selector hack that broke when iframes were not siblings.) */
  frameByIndex(index: number): FrameLocator {
    return this.page.frameLocator('iframe').nth(index);
  }

  async frameByNameOrId(nameOrId: string): Promise<FrameLocator> {
    const escaped = nameOrId.replace(/"/g, '\\"');
    const byId = `iframe[id="${escaped}"]`;
    if (await this.isFramePresent(byId)) {
      return this.page.frameLocator(byId);
    }
    const byName = `iframe[name="${escaped}"]`;
    if (await this.isFramePresent(byName)) {
      return this.page.frameLocator(byName);
    }
    throw new Error(`Frame with name or ID '${nameOrId}' not found`);
  }

  /** Locator pointing at an <iframe> element -> FrameLocator (Java rebuilt a selector from toString()). */
  frameByLocator(iframeLocator: Locator): FrameLocator {
    return iframeLocator.contentFrame();
  }

  async isFramePresent(selector: string): Promise<boolean> {
    try {
      return (await this.page.locator(selector).count()) > 0;
    } catch {
      return false;
    }
  }
}
