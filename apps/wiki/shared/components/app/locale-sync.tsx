'use client';

import { reatomComponent } from '@reatom/npm-react';
import type { Locale } from '@/paraglide/runtime';
import { $locale, setLocale } from '@/shared/models/locale.model';

/**
 * Puts the server-resolved locale into `$locale` before anything else renders.
 * Replaces the former React context: the locale is just an atom now.
 */
export const LocaleSync = reatomComponent<{ locale: Locale }>(({ ctx, locale }) => {
  if (ctx.spy($locale) !== locale) setLocale(ctx, locale);
  return null;
});
