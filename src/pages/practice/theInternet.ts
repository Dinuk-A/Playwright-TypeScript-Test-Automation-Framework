import { Dialog, FrameLocator, Locator, Page } from '@playwright/test';
import { env } from '../../config/env';
import { ElementActions } from '../../utils/ui/elementActions';
import { IframeActions } from '../../utils/ui/iframeActions';
import { PopupActions } from '../../utils/ui/popupActions';

/**
 * Page objects for https://the-internet.herokuapp.com (practice site used by the example specs).
 * Kept together here only to keep the examples compact; in the real project use one file per POM.
 * Locators are structural (ids, attributes, classes), never translated text.
 */
const url = (pathname: string): string => `${env.practice.herokuappBaseUrl}${pathname}`;

export class LoginPage {
  readonly flash: Locator;
  private readonly username: Locator;
  private readonly password: Locator;
  private readonly submit: Locator;
  private readonly actions: ElementActions;

  constructor(private readonly page: Page) {
    this.username = page.locator('#username');
    this.password = page.locator('#password');
    this.submit = page.locator('form#login button[type="submit"]');
    this.flash = page.locator('#flash');
    this.actions = new ElementActions(page);
  }

  async open(): Promise<void> {
    await this.page.goto(url('/login'));
  }

  async login(user: string, pass: string): Promise<void> {
    await this.actions.type(this.username, user);
    await this.actions.type(this.password, pass);
    await this.actions.click(this.submit);
  }
}

export class CheckboxesPage {
  readonly boxes: Locator;
  constructor(private readonly page: Page) {
    this.boxes = page.locator('#checkboxes input[type="checkbox"]');
  }
  async open(): Promise<void> {
    await this.page.goto(url('/checkboxes'));
  }
  box(index: number): Locator {
    return this.boxes.nth(index);
  }
}

export class DropdownPage {
  readonly select: Locator;
  private readonly actions: ElementActions;
  constructor(private readonly page: Page) {
    this.select = page.locator('#dropdown');
    this.actions = new ElementActions(page);
  }
  async open(): Promise<void> {
    await this.page.goto(url('/dropdown'));
  }
  selectByValue(value: string): Promise<void> {
    return this.actions.selectByValue(this.select, value);
  }
  selectByVisibleText(text: string): Promise<void> {
    return this.actions.selectByVisibleText(this.select, text);
  }
  selectByIndex(index: number): Promise<void> {
    return this.actions.selectByIndex(this.select, index);
  }
}

/** Example 2: the result element is added to the DOM only after loading finishes. */
export class DynamicLoadingPage {
  readonly finishText: Locator;
  private readonly startButton: Locator;
  private readonly actions: ElementActions;
  constructor(private readonly page: Page) {
    this.startButton = page.locator('#start button');
    this.finishText = page.locator('#finish h4');
    this.actions = new ElementActions(page);
  }
  async open(): Promise<void> {
    await this.page.goto(url('/dynamic_loading/2'));
  }
  async start(): Promise<void> {
    await this.actions.click(this.startButton);
  }
}

export class JavaScriptAlertsPage {
  readonly result: Locator;
  private readonly popups: PopupActions;
  constructor(private readonly page: Page) {
    this.result = page.locator('#result');
    this.popups = new PopupActions(page);
  }
  async open(): Promise<void> {
    await this.page.goto(url('/javascript_alerts'));
  }

  /** Each helper clicks the trigger, handles the dialog, and returns the dialog's message. */
  acceptAlert(): Promise<string> {
    return this.handle('button[onclick="jsAlert()"]', (d) => this.popups.acceptPopup(d));
  }
  acceptConfirm(): Promise<string> {
    return this.handle('button[onclick="jsConfirm()"]', (d) => this.popups.acceptPopup(d));
  }
  dismissConfirm(): Promise<string> {
    return this.handle('button[onclick="jsConfirm()"]', (d) => this.popups.dismissPopup(d));
  }
  answerPrompt(text: string): Promise<string> {
    return this.handle('button[onclick="jsPrompt()"]', (d) => this.popups.inputTextToPrompt(d, text));
  }

  /** The click is not awaited until the dialog is handled, otherwise the blocked page deadlocks the click. */
  private async handle(triggerSelector: string, handler: (dialog: Dialog) => Promise<void>): Promise<string> {
    const dialogPromise = this.page.waitForEvent('dialog');
    const clickPromise = this.page.locator(triggerSelector).click();
    const dialog = await dialogPromise;
    const message = this.popups.getPopupText(dialog);
    await handler(dialog);
    await clickPromise;
    return message;
  }
}

export class AddRemoveElementsPage {
  readonly deleteButtons: Locator;
  private readonly addButton: Locator;
  constructor(private readonly page: Page) {
    this.addButton = page.locator('button[onclick="addElement()"]');
    this.deleteButtons = page.locator('#elements button.added-manually');
  }
  async open(): Promise<void> {
    await this.page.goto(url('/add_remove_elements/'));
  }
  async addElement(times = 1): Promise<void> {
    for (let i = 0; i < times; i++) {
      await this.addButton.click();
    }
  }
  async deleteElement(index: number): Promise<void> {
    await this.deleteButtons.nth(index).click();
  }
}

export class TablesPage {
  readonly rows: Locator;
  constructor(private readonly page: Page) {
    this.rows = page.locator('#table1 tbody tr');
  }
  async open(): Promise<void> {
    await this.page.goto(url('/tables'));
  }
  /** 0-based column index. */
  async sortByColumn(columnIndex: number): Promise<void> {
    await this.page.locator(`#table1 thead th:nth-child(${columnIndex + 1})`).click();
  }
  async getColumnTexts(columnIndex: number): Promise<string[]> {
    const texts = await this.page.locator(`#table1 tbody td:nth-child(${columnIndex + 1})`).allTextContents();
    return texts.map((t) => t.trim());
  }
}

export class IframePage {
  private readonly frames: IframeActions;
  constructor(private readonly page: Page) {
    this.frames = new IframeActions(page);
  }
  async open(): Promise<void> {
    await this.page.goto(url('/iframe'));
  }
  async editorFrame(): Promise<FrameLocator> {
    return this.frames.frameByNameOrId('mce_0_ifr');
  }
  async editorBody(): Promise<Locator> {
    return (await this.editorFrame()).locator('#tinymce');
  }
}

export class WindowsPage {
  private readonly link: Locator;
  constructor(private readonly page: Page) {
    this.link = page.locator('a[href="/windows/new"]');
  }
  async open(): Promise<void> {
    await this.page.goto(url('/windows'));
  }
  async clickOpenNewWindow(): Promise<void> {
    await this.link.click();
  }
}

export class FileUploadPage {
  readonly uploadedFiles: Locator;
  private readonly input: Locator;
  private readonly submit: Locator;
  private readonly actions: ElementActions;
  constructor(private readonly page: Page) {
    this.input = page.locator('#file-upload');
    this.submit = page.locator('#file-submit');
    this.uploadedFiles = page.locator('#uploaded-files');
    this.actions = new ElementActions(page);
  }
  async open(): Promise<void> {
    await this.page.goto(url('/upload'));
  }
  async upload(filePath: string): Promise<void> {
    await this.actions.uploadFile(this.input, filePath);
    await this.actions.click(this.submit);
  }
}
