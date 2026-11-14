'use client';

import { Menu } from '@ark-ui/react/menu';
import { Portal } from '@ark-ui/react/portal';
import { reatomComponent } from '@reatom/npm-react';
import { IconCheck } from '@tabler/icons-react';
import type { Locale } from '@/paraglide/runtime';
import { m } from '@/paraglide/messages';
import { $locale, setLocale, writeLocaleCookie } from '@/shared/models/locale.model';

const LOCALES: { value: Locale; label: string }[] = [
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
];

function Flag({ locale, className }: { locale: Locale; className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-flex h-4 w-6 shrink-0 overflow-hidden rounded-sm ring-1 ring-black/10 ${className ?? ''}`}
    >
      {locale === 'ru' ? (
        <svg viewBox="0 0 24 16" className="size-full" role="presentation">
          <rect width="24" height="16" fill="#fff" />
          <rect y="5.33" width="24" height="5.34" fill="#0039a6" />
          <rect y="10.67" width="24" height="5.33" fill="#d52b1e" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 16" className="size-full" role="presentation">
          <rect width="24" height="16" fill="#012169" />
          <path d="M0 0 24 16M24 0 0 16" stroke="#fff" strokeWidth="3.4" />
          <path d="M0 0 24 16M24 0 0 16" stroke="#c8102e" strokeWidth="1.7" />
          <path d="M12 0v16M0 8h24" stroke="#fff" strokeWidth="5.6" />
          <path d="M12 0v16M0 8h24" stroke="#c8102e" strokeWidth="3.4" />
        </svg>
      )}
    </span>
  );
}

/** Language is a flag; the menu lists the available languages natively. */
export const LanguageMenu = reatomComponent(({ ctx }) => {
  const locale = ctx.spy($locale);

  const choose = (value: Locale) => {
    if (value === locale) return;

    // the server reads the same cookie, so a reload renders the other language
    writeLocaleCookie(value);
    setLocale(ctx, value);
    window.location.reload();
  };

  return (
    <Menu.Root>
      <Menu.Trigger
        data-testid="language-menu"
        aria-label={m['language.toggle']({}, { locale })}
        title={LOCALES.find((item) => item.value === locale)?.label}
        className="
          inline-flex size-8 items-center justify-center rounded-lg transition-colors
          hover:bg-fd-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fd-ring
        "
      >
        <Flag locale={locale} />
      </Menu.Trigger>

      <Portal>
        <Menu.Positioner>
          <Menu.Content
            className="
              z-[60] min-w-40 rounded-lg border border-fd-border bg-fd-popover p-1
              text-fd-popover-foreground shadow-lg outline-none
              data-[state=open]:animate-in data-[state=open]:fade-in
              data-[state=closed]:animate-out data-[state=closed]:fade-out
            "
          >
            {LOCALES.map((item) => {
              const selected = item.value === locale;

              return (
                <Menu.Item key={item.value} value={item.value} asChild>
                  <button
                    type="button"
                    onClick={() => choose(item.value)}
                    className="
                      flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none
                      transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground
                    "
                  >
                    <Flag locale={item.value} />
                    <span className="flex-1 text-start">{item.label}</span>
                    <IconCheck
                      size={14}
                      stroke={2}
                      className={selected ? 'text-fd-primary opacity-100' : 'opacity-0'}
                      aria-hidden
                    />
                  </button>
                </Menu.Item>
              );
            })}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}, 'LanguageMenu');
