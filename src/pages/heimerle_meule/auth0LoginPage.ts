import { Locator, Page } from '@playwright/test';
import { ElementActions } from '../../utils/ui/elementActions';
import { waitForElementHidden, waitForElementVisible } from '../../utils/ui/waitUtils';

/**
 * Auth0 Universal Login used by the Ecos Next.js app (port of Java Auth0LoginPage). Two steps on
 * the same URL family: (1) email identifier, (2) password.
 *
 * Assumptions to verify (carried over from the Java POM):
 * 1. Everything is scoped to form[data-form-primary='true']; input#username exists only on step 1,
 *    input#password only on step 2.
 * 2. Locators use ids, names and data-* attributes only, so they are independent of the Auth0 UI language.
 * 3. A successful login removes the password input (redirect back to the app); a failed one keeps it with a visible .ulp-error-info.
 * 4. The captured DOM was sanitised, so the real page may carry extra elements (social/passkey buttons, captcha).
 */
const PRIMARY_FORM = "form[data-form-primary='true']";

export class Auth0LoginPage {
  private readonly actions: ElementActions;
  private readonly emailInput: Locator;
  private readonly passwordInput: Locator;
  private readonly continueButton: Locator;
  private readonly validationMessages: Locator;

  /** Same locator as PLPHomePage.SIGN_IN_BUTTON in the Java POM; swap for PLPHomePage.clickSignIn() once that is ported. */
  private static readonly APP_SIGN_IN = "header button[aria-label='Sign in']";

  constructor(private readonly page: Page, private readonly element: Locator = page.locator('body')) {
    this.actions = new ElementActions(page);
    this.emailInput = element.locator(`${PRIMARY_FORM} input#username`);
    this.passwordInput = element.locator(`${PRIMARY_FORM} input#password`);
    this.continueButton = element.locator(`${PRIMARY_FORM} button[data-action-button-primary='true']`);
    this.validationMessages = element.locator(`${PRIMARY_FORM} .ulp-error-info`);
  }

  // ---- entry from the app
  async startLoginFromApp(appBaseUrl: string): Promise<void> {
    await this.page.goto(appBaseUrl);
    await this.page.locator(Auth0LoginPage.APP_SIGN_IN).click();
  }

  // ---- step detection / waits
  isEmailStepVisible(): Promise<boolean> {
    return this.emailInput.isVisible();
  }
  isPasswordStepVisible(): Promise<boolean> {
    return this.passwordInput.isVisible();
  }
  async isLoginPageDisplayed(): Promise<boolean> {
    return (await this.isEmailStepVisible()) || (await this.isPasswordStepVisible());
  }
  async waitForEmailStep(timeoutMs: number): Promise<void> {
    await waitForElementVisible(this.emailInput, timeoutMs);
  }
  async waitForPasswordStep(timeoutMs: number): Promise<void> {
    await waitForElementVisible(this.passwordInput, timeoutMs);
  }
  /** Waits until the password input is gone (redirected back to the app). */
  async waitForLoginToComplete(timeoutMs: number): Promise<void> {
    await waitForElementHidden(this.passwordInput, timeoutMs);
  }

  // ---- read (localized text is read-only)
  async getHeadingText(): Promise<string> {
    return ((await this.element.locator('#screen-header h1').textContent()) ?? '').trim();
  }
  getEmailValue(): Promise<string> {
    return this.emailInput.inputValue();
  }
  /** Email echoed (read-only) on the password step. */
  getConfirmedEmail(): Promise<string> {
    return this.element.locator(`${PRIMARY_FORM} input[name='username'][readonly]`).inputValue();
  }
  isContinueButtonVisible(): Promise<boolean> {
    return this.continueButton.isVisible();
  }
  isContinueButtonEnabled(): Promise<boolean> {
    return this.continueButton.isEnabled();
  }
  async isPasswordMasked(): Promise<boolean> {
    return ((await this.passwordInput.getAttribute('type')) ?? '').toLowerCase() === 'password';
  }
  isShowPasswordToggleVisible(): Promise<boolean> {
    return this.element.locator(`${PRIMARY_FORM} button[data-action='toggle']`).isVisible();
  }
  isEditEmailLinkVisible(): Promise<boolean> {
    return this.element.locator(`${PRIMARY_FORM} a[data-link-name='edit-username']`).isVisible();
  }
  isResetPasswordLinkVisible(): Promise<boolean> {
    return this.element.locator(`${PRIMARY_FORM} a[href*='password-reset-start']`).isVisible();
  }
  /** Texts of the validation messages currently displayed (hidden ones are skipped). */
  async getVisibleValidationMessages(): Promise<string[]> {
    const messages: string[] = [];
    const count = await this.validationMessages.count();
    for (let i = 0; i < count; i++) {
      const message = this.validationMessages.nth(i);
      if (await message.isVisible()) {
        messages.push(((await message.textContent()) ?? '').trim());
      }
    }
    return messages;
  }
  async hasVisibleValidationMessage(): Promise<boolean> {
    return (await this.getVisibleValidationMessages()).length > 0;
  }

  // ---- actions
  enterEmail(email: string): Promise<void> {
    return this.actions.type(this.emailInput, email);
  }
  enterPassword(password: string): Promise<void> {
    return this.actions.type(this.passwordInput, password);
  }
  clickContinue(): Promise<void> {
    return this.actions.click(this.continueButton);
  }
  clickShowPasswordToggle(): Promise<void> {
    return this.actions.click(this.element.locator(`${PRIMARY_FORM} button[data-action='toggle']`));
  }
  clickEditEmail(): Promise<void> {
    return this.actions.click(this.element.locator(`${PRIMARY_FORM} a[data-link-name='edit-username']`));
  }
  clickResetPassword(): Promise<void> {
    return this.actions.click(this.element.locator(`${PRIMARY_FORM} a[href*='password-reset-start']`));
  }

  /** Full two-step login; returns once the password input has disappeared. */
  async loginAs(email: string, password: string, stepTimeoutMs: number): Promise<void> {
    await this.waitForEmailStep(stepTimeoutMs);
    await this.enterEmail(email);
    await this.clickContinue();
    await this.waitForPasswordStep(stepTimeoutMs);
    await this.enterPassword(password);
    await this.clickContinue();
    await this.waitForLoginToComplete(stepTimeoutMs);
  }
}
