'use client';

import { reatomComponent } from '@reatom/npm-react';
import { m } from '@/paraglide/messages';
import type { Locale } from '@/paraglide/runtime';
import { $locale, setLocale, writeLocaleCookie } from '@/shared/models/locale.model';
import { Segmented } from '@/shared/ui/segmented';

const LOCALES: { value: Locale; label: string }[] = [
  { value: 'ru', label: 'RU' },
  { value: 'en', label: 'EN' },
];

export const LanguageToggle = reatomComponent(({ ctx }) => {
  const locale = ctx.spy($locale);

  const choose = (value: Locale) => {
    if (value === locale) return;

    // the server reads the same cookie, so a reload renders the other language
    writeLocaleCookie(value);
    setLocale(ctx, value);
    window.location.reload();
  };

  return (
    <Segmented
      label={m['language.toggle']({}, { locale })}
      testId="language-switch"
      value={locale}
      options={LOCALES}
      onSelect={choose}
    />
  );
});
