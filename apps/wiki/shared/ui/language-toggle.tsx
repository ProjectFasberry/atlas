'use client';

import { reatomComponent } from '@reatom/npm-react';
import { cn } from '@/lib/cn';
import type { Locale } from '@/paraglide/runtime';
import { $locale, setLocale, writeLocaleCookie } from '@/shared/models/locale.model';

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
    <div
      role="group"
      aria-label="Language"
      className="inline-flex items-center gap-0.5 rounded-full border p-1 text-[11px] font-medium"
    >
      {LOCALES.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => choose(value)}
          aria-pressed={value === locale}
          className={cn(
            'rounded-full px-2 py-1.5 uppercase transition-colors',
            value === locale
              ? 'bg-fd-accent text-fd-accent-foreground'
              : 'text-fd-muted-foreground hover:text-fd-accent-foreground',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
});
