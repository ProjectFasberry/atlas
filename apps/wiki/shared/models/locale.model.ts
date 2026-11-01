import { action, atom } from '@reatom/framework';
import { baseLocale, type Locale } from '@/paraglide/runtime';

/** Locale of the current render: set on the server pass, read by every component. */
export const $locale = atom<Locale>((baseLocale as Locale) ?? 'ru', 'locale');

export const setLocale = action((ctx, locale: Locale) => {
  $locale(ctx, locale);
}, 'locale.set');

/** Cookie name shared with the proxy and `lib/i18n.ts`. */
export const LOCALE_COOKIE = 'locale';
export const LOCALE_MAX_AGE = 60 * 60 * 24 * 365;

export function writeLocaleCookie(locale: Locale) {
  // biome-ignore lint/suspicious/noDocumentCookie: CookieStore is not supported everywhere
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_MAX_AGE}; samesite=lax`;
}
