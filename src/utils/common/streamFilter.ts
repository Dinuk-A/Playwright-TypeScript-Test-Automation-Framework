import { logger } from './logger';

/**
 * Port of Java StreamFilter: scans an SSE-style text body ("data: {json}" lines) and returns the
 * first JSON object whose `field` equals `value`, or null.
 */
export function extractFieldFromStream(streamResponse: string, field: string, value: string): Record<string, unknown> | null {
  for (const line of streamResponse.split('\n')) {
    if (!line.startsWith('data:')) {
      continue;
    }
    const json = line.slice(5).trim();
    try {
      const node = JSON.parse(json) as Record<string, unknown>;
      if (node && String(node[field]) === value) {
        return node;
      }
    } catch {
      logger.info(`Invalid JSON in stream: ${json}`);
    }
  }
  return null;
}
