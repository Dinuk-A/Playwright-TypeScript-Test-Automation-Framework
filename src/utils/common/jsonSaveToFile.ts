import * as fs from 'fs';
import * as path from 'path';
import { logger } from './logger';

/** Port of Java JsonSaveToFile: pretty-prints and creates parent folders. Never throws (logs instead), like Java. */
export function saveJsonToFile(data: unknown, filePath: string): void {
  const file = path.resolve(process.cwd(), filePath);
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
    logger.info(`JSON saved to: ${filePath}`);
  } catch (error) {
    logger.error(`Error saving JSON to file: ${(error as Error).message}`);
  }
}
