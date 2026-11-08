/** Replaces SLF4J usage in the Java utils (no logging dependency is installed). */
const stamp = (): string => new Date().toISOString();

export const logger = {
  info: (message: string, ...args: unknown[]): void => console.log(`${stamp()} INFO  ${message}`, ...args),
  warn: (message: string, ...args: unknown[]): void => console.warn(`${stamp()} WARN  ${message}`, ...args),
  error: (message: string, ...args: unknown[]): void => console.error(`${stamp()} ERROR ${message}`, ...args),
  debug: (message: string, ...args: unknown[]): void => {
    if (process.env.DEBUG_LOG) {
      console.log(`${stamp()} DEBUG ${message}`, ...args);
    }
  },
};
