import { Dialog, Page } from '@playwright/test';
import { logger } from '../common/logger';

/** Port of Java PopupActions (JS alert/confirm/prompt dialogs). */
export class PopupActions {
  constructor(private readonly page: Page) {}

  async acceptPopup(dialog: Dialog): Promise<void> {
    await dialog.accept();
  }

  async dismissPopup(dialog: Dialog): Promise<void> {
    await dialog.dismiss();
  }

  getPopupText(dialog: Dialog): string {
    return dialog.message();
  }

  async inputTextToPrompt(dialog: Dialog, text: string): Promise<void> {
    await dialog.accept(text);
  }

  /** Accept every dialog for the rest of the page's life. Playwright auto-dismisses if no handler exists. */
  setupAutoAccept(): void {
    this.page.on('dialog', (dialog) => {
      logger.info(`Auto-accepting dialog: ${dialog.message()}`);
      dialog.accept().catch(() => undefined);
    });
  }

  setupAutoDismiss(): void {
    this.page.on('dialog', (dialog) => {
      logger.info(`Auto-dismissing dialog: ${dialog.message()}`);
      dialog.dismiss().catch(() => undefined);
    });
  }
}
