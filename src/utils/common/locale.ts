export type Locale = 'en' | 'de';

/** EN is the site root, DE lives under /de. Never derive locale from translated text. */
export function localizedUrl(baseUrl: string, locale: Locale): string {
  const root = baseUrl.replace(/\/+$/, '');
  return locale === 'de' ? `${root}/de` : root;
}
