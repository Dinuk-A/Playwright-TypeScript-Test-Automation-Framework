import { BrowserContext, Download, Page } from '@playwright/test';
import { logger } from '../common/logger';

/**
 * Port of Java TabActions (Playwright version). Behaviour change: the Java methods swallowed
 * PlaywrightException and returned null; these throw, so a missing tab fails the test at the cause.
 */
export class TabActions {
  constructor(
    private readonly page: Page,
    private readonly context: BrowserContext,
  ) {}

  async openNewTab(): Promise<Page> {
    return this.context.newPage();
  }

  async openNewTabWithUrl(url: string): Promise<Page> {
    const newPage = await this.context.newPage();
    await newPage.goto(url);
    return newPage;
  }

  async switchToTab(tabIndex: number): Promise<Page> {
    const pages = this.context.pages();
    if (tabIndex < 0 || tabIndex >= pages.length) {
      throw new Error(`Tab index ${tabIndex} not found (open tabs: ${pages.length})`);
    }
    await pages[tabIndex].bringToFront();
    return pages[tabIndex];
  }

  async switchToPage(targetPage: Page): Promise<void> {
    await targetPage.bringToFront();
  }

  async switchToMainTab(): Promise<Page> {
    return this.switchToTab(0);
  }

  async closeCurrentTab(): Promise<void> {
    await this.page.close();
  }

  async closeTab(targetPage: Page): Promise<void> {
    await targetPage.close();
  }

  async closeAllTabsExceptMain(): Promise<void> {
    const pages = this.context.pages();
    for (let i = pages.length - 1; i > 0; i--) {
      await pages[i].close();
    }
    if (pages.length > 0) {
      await pages[0].bringToFront();
    }
  }

  getTabCount(): number {
    return this.context.pages().length;
  }

  getCurrentTabIndex(): number {
    return this.context.pages().indexOf(this.page);
  }

  getAllPages(): Page[] {
    return this.context.pages();
  }

  async getAllTabTitles(): Promise<string[]> {
    return Promise.all(this.context.pages().map((p) => p.title()));
  }

  getAllTabUrls(): string[] {
    return this.context.pages().map((p) => p.url());
  }

  async switchToTabByTitle(title: string): Promise<Page> {
    for (const p of this.context.pages()) {
      if ((await p.title()) === title) {
        await p.bringToFront();
        return p;
      }
    }
    throw new Error(`Tab with title '${title}' not found`);
  }

  async switchToTabByUrl(url: string): Promise<Page> {
    const found = this.context.pages().find((p) => p.url() === url);
    if (!found) {
      throw new Error(`Tab with URL '${url}' not found`);
    }
    await found.bringToFront();
    return found;
  }

  async waitForNewTabAndReturn(action: () => Promise<void>): Promise<Page> {
    const [newPage] = await Promise.all([this.context.waitForEvent('page'), action()]);
    return newPage;
  }

  /**
   * Convention #9: in headless Chromium a target=_blank PDF link fires a Download event, not a Page
   * event. Runs `action` and resolves with whichever happened. The download listener is attached to
   * `this.page`; verify against the real PDF links whether it must be attached to the popup instead.
   */
  async waitForNewTabOrDownload(
    action: () => Promise<void>,
    timeoutMs = 15000,
  ): Promise<{ page?: Page; download?: Download }> {
    const pagePromise = this.context.waitForEvent('page', { timeout: timeoutMs });
    const downloadPromise = this.page.waitForEvent('download', { timeout: timeoutMs });
    await action();
    return Promise.race([
      pagePromise.then((p) => ({ page: p })),
      downloadPromise.then((d) => ({ download: d })),
    ]);
  }

  printCurrentTabUrl(): void {
    logger.info(`Current tab URL: ${this.page.url()}`);
  }

  async printCurrentTabTitle(): Promise<void> {
    logger.info(`Current tab title: ${await this.page.title()}`);
  }

  async printAllTabDetails(): Promise<void> {
    const pages = this.context.pages();
    logger.info(`Total tabs open: ${pages.length}`);
    for (let i = 0; i < pages.length; i++) {
      logger.info(`Tab ${i} - Title: ${await pages[i].title()} | URL: ${pages[i].url()}`);
    }
  }
}
