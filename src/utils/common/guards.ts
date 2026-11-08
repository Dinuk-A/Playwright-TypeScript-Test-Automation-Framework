import { test } from '@playwright/test';

/**
 * Vacuous-truth guard. Call before any loop-based assertion: if it ran over zero items it would
 * pass silently. Fails and leaves an explicit NOT EXERCISED note in the Allure report.
 */
export async function assertExercised(count: number, description: string): Promise<void> {
  if (count > 0) {
    return;
  }
  const message = `NOT EXERCISED: ${description} matched zero items, so the assertions that follow would pass vacuously.`;
  await test.info().attach('NOT EXERCISED', { body: message, contentType: 'text/plain' });
  throw new Error(message);
}
