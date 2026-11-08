import { Page, test } from '@playwright/test';
import { captureScreenshot } from '../ui/screenshot';
import { waitForPageFullyLoaded } from '../ui/waitUtils';

interface AssertionRecord {
  name: string;
  status: 'PASS' | 'FAIL';
  message: string;
  screenshotBase64?: string;
}

/**
 * Replaces AllureEvidenceLogger. Per-test instance supplied by the `evidence` fixture, so the
 * Java resetLog()/attachSummary() @BeforeMethod/@AfterMethod pair and the ThreadLocal disappear.
 * Every assertion runs inside test.step (pass/fail in the step tree) and is recorded with a screenshot.
 */
export class EvidenceLog {
  private readonly records: AssertionRecord[] = [];

  async assertStep(name: string, page: Page | undefined, assertion: () => Promise<void> | void): Promise<void> {
    const record: AssertionRecord = { name, status: 'PASS', message: '' };
    try {
      await test.step(name, async () => {
        await assertion();
      });
    } catch (error) {
      record.status = 'FAIL';
      record.message = error instanceof Error ? error.message : String(error);
      throw error;
    } finally {
      if (page) {
        await waitForPageFullyLoaded(page);
        const shot = await captureScreenshot(page);
        record.screenshotBase64 = shot?.toString('base64');
      }
      this.records.push(record);
    }
  }

  get entries(): readonly AssertionRecord[] {
    return this.records;
  }

  async attachSummary(attachmentName = 'Assertion Summary'): Promise<void> {
    if (this.records.length === 0) {
      return;
    }
    await test.info().attach(attachmentName, {
      body: EvidenceLog.buildHtml(this.records),
      contentType: 'text/html',
    });
  }

  private static buildHtml(records: readonly AssertionRecord[]): string {
    const rows = records
      .map((r, i) => {
        const cls = r.status === 'PASS' ? 'pass' : 'fail';
        const img = r.screenshotBase64 ? `<img src="data:image/png;base64,${r.screenshotBase64}"/>` : '&mdash;';
        return `<tr><td>${i + 1}</td><td>${escapeHtml(r.name)}</td><td class="${cls}">${r.status}</td><td>${escapeHtml(r.message)}</td><td>${img}</td></tr>`;
      })
      .join('');
    return (
      '<html><head><style>' +
      'body{margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#222}' +
      'table{border-collapse:collapse;width:100%}' +
      'th,td{border:1px solid #ddd;padding:8px 10px;text-align:left;vertical-align:top}' +
      'th{background:#f5f5f5;position:sticky;top:0}' +
      '.pass{color:#1a7f37;font-weight:bold}.fail{color:#c0392b;font-weight:bold}' +
      'img{max-width:240px;border:1px solid #ccc;border-radius:4px}' +
      '</style></head><body><table>' +
      '<tr><th>#</th><th>Assertion</th><th>Status</th><th>Details</th><th>Screenshot</th></tr>' +
      `${rows}</table></body></html>`
    );
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
