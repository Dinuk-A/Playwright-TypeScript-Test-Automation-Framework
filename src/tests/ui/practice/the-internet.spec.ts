import { test, expect } from '../../../fixtures';
import {
  AddRemoveElementsPage,
  CheckboxesPage,
  DropdownPage,
  DynamicLoadingPage,
  FileUploadPage,
  IframePage,
  JavaScriptAlertsPage,
  LoginPage,
  TablesPage,
  WindowsPage,
} from '../../../pages/practice/theInternet';
import { assertExercised } from '../../../utils/common/guards';
import { createTextFile } from '../../../utils/common/fileUtils';
import { attachScreenshot, screenshotName } from '../../../utils/ui/screenshot';
import { TabActions } from '../../../utils/ui/tabActions';
import {
  assertAttributeEquals,
  assertElementChecked,
  assertElementContainsText,
  assertElementCount,
  assertElementHasText,
  assertElementNotChecked,
  assertElementVisible,
  assertHasClass,
  assertInputValue,
  assertUrlContains,
} from '../../../utils/ui/uiAssertionUtils';
import { waitForElementVisible } from '../../../utils/ui/waitUtils';

/**
 * Example UI specs against https://the-internet.herokuapp.com. Shows: POMs, ElementActions,
 * uiAssertionUtils, waitUtils, PopupActions, TabActions, IframeActions, evidence table, screenshots.
 * (This practice site is English-only, so its flash messages are asserted by class, not text.)
 */
test.describe('The Internet - authentication', { tag: ['@ui', '@practice'] }, () => {
  test('TC-HRK-001 valid credentials log the user in', async ({ page, evidence }) => {
    const login = new LoginPage(page);
    await login.open();
    await login.login('tomsmith', 'SuperSecretPassword!');

    await evidence.assertStep('Assert: redirected to the secure area', page, () => assertUrlContains(page, '/secure'));
    await evidence.assertStep('Assert: flash message is a success', page, () => assertHasClass(login.flash, 'success'));
    await attachScreenshot(page, screenshotName('HRK', 'Logged in'));
  });

  test('TC-HRK-002 invalid credentials show an error and stay on the login page', async ({ page, evidence }) => {
    const login = new LoginPage(page);
    await login.open();
    await login.login('tomsmith', 'wrong-password');

    await evidence.assertStep('Assert: still on /login', page, () => assertUrlContains(page, '/login'));
    await evidence.assertStep('Assert: flash message is an error', page, () => assertHasClass(login.flash, 'error'));
  });
});

test.describe('The Internet - form controls', { tag: ['@ui', '@practice'] }, () => {
  test('TC-HRK-003 checkboxes can be toggled', async ({ page }) => {
    const checkboxes = new CheckboxesPage(page);
    await checkboxes.open();
    await assertElementCount(checkboxes.boxes, 2);
    await assertElementNotChecked(checkboxes.box(0));
    await assertElementChecked(checkboxes.box(1));

    await checkboxes.box(0).check();
    await checkboxes.box(1).uncheck();

    await assertElementChecked(checkboxes.box(0));
    await assertElementNotChecked(checkboxes.box(1));
  });

  test('TC-HRK-004 dropdown can be set by value, text and index', async ({ page }) => {
    const dropdown = new DropdownPage(page);
    await dropdown.open();

    await dropdown.selectByValue('2');
    await assertInputValue(dropdown.select, '2');

    await dropdown.selectByVisibleText('Option 1');
    await assertInputValue(dropdown.select, '1');

    await dropdown.selectByIndex(2); // index 0 is the disabled placeholder
    await assertInputValue(dropdown.select, '2');
  });

  test('TC-HRK-005 file upload lists the uploaded file name', async ({ page }, testInfo) => {
    const upload = new FileUploadPage(page);
    await upload.open();
    const file = createTextFile(testInfo.outputPath('upload-me.txt'), 'hello from the framework');

    await upload.upload(file);

    await assertElementContainsText(upload.uploadedFiles, 'upload-me.txt');
  });
});

test.describe('The Internet - dynamic content', { tag: ['@ui', '@practice'] }, () => {
  test('TC-HRK-006 element rendered after loading becomes visible', async ({ page, evidence }) => {
    const dynamic = new DynamicLoadingPage(page);
    await dynamic.open();
    await expect(dynamic.finishText, 'result must not exist before Start').toHaveCount(0);

    await dynamic.start();
    await waitForElementVisible(dynamic.finishText, 15_000);

    await evidence.assertStep('Assert: result text is shown', page, () => assertElementHasText(dynamic.finishText));
  });

  test('TC-HRK-007 add and remove elements', async ({ page }) => {
    const elements = new AddRemoveElementsPage(page);
    await elements.open();

    await elements.addElement(3);
    await assertElementCount(elements.deleteButtons, 3);

    await elements.deleteElement(0);
    await assertElementCount(elements.deleteButtons, 2);
  });

  test('TC-HRK-008 JavaScript alert, confirm and prompt dialogs', async ({ page }) => {
    const alerts = new JavaScriptAlertsPage(page);
    await alerts.open();

    expect(await alerts.acceptAlert()).toContain('I am a JS Alert');
    await assertElementContainsText(alerts.result, 'successfully clicked an alert');

    expect(await alerts.dismissConfirm()).toContain('I am a JS Confirm');
    await assertElementContainsText(alerts.result, 'Cancel');

    expect(await alerts.answerPrompt('framework')).toContain('I am a JS prompt');
    await assertElementContainsText(alerts.result, 'framework');
  });
});

test.describe('The Internet - navigation, tables and frames', { tag: ['@ui', '@practice'] }, () => {
  test('TC-HRK-009 link opens a new tab and we can switch back', async ({ page, context }) => {
    const windows = new WindowsPage(page);
    await windows.open();
    const tabs = new TabActions(page, context);

    const newTab = await tabs.waitForNewTabAndReturn(() => windows.clickOpenNewWindow());
    await newTab.waitForLoadState();

    expect(tabs.getTabCount()).toBe(2);
    await assertElementVisible(newTab.locator('h3'));

    await tabs.switchToMainTab();
    expect(tabs.getCurrentTabIndex()).toBe(0);
  });

  test('TC-HRK-010 table can be sorted by last name', async ({ page }) => {
    const tables = new TablesPage(page);
    await tables.open();
    await assertExercised(await tables.rows.count(), 'rows in #table1');

    await tables.sortByColumn(0); // Last Name
    const lastNames = await tables.getColumnTexts(0);

    await assertExercised(lastNames.length, 'Last Name cells');
    const ascending = [...lastNames].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    expect(lastNames).toEqual(ascending);
  });

  test('TC-HRK-011 editor inside an iframe is reachable', async ({ page }) => {
    const iframe = new IframePage(page);
    await iframe.open();

    const body = await iframe.editorBody();
    await assertElementHasText(body);
    await assertAttributeEquals(body, 'contenteditable', 'true');
  });
});
