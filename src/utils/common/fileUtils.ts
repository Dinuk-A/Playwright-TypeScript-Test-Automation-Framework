import * as fs from 'fs';
import * as path from 'path';

/** Creates (and returns the path of) a small text file, e.g. for upload tests. Use testInfo.outputPath(name). */
export function createTextFile(filePath: string, content: string): string {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}
