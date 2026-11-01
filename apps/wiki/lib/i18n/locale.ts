import { cookies, headers } from 'next/headers';
import { baseLocale, isLocale, type Locale } from '@/paraglide/runtime';

export const LOCALE_COOKIE = 'locale';
export const LOCALES: Locale[] = ['ru', 'en'];
export const DEFAULT_LOCALE: Locale = baseLocale as Locale;

/** Picks the first supported language from an `Accept-Language` header. */
export function detectLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const ranked = acceptLanguage
    .split(',')
    .map((part) => {
      const [tag, quality] = part.trim().split(';q=');
      return {
        language: tag.split('-')[0].toLowerCase(),
        quality: Number.parseFloat(quality ?? '1') || 0,
      };
    })
    .sort((a, b) => b.quality - a.quality);

  for (const entry of ranked) {
    if (isLocale(entry.language)) return entry.language;
  }

  return DEFAULT_LOCALE;
}

/** The locale of the current request: the cookie wins, then `Accept-Language`. */
export async function getLocale(): Promise<Locale> {
  const cookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(cookie)) return cookie;

  return detectLocale((await headers()).get('accept-language'));
}
