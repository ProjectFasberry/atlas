'use client';

import { reatomComponent } from '@reatom/npm-react';
import { Classic } from '@theme-toggles/react';
import { m } from '@/paraglide/messages';
import { $locale } from '@/shared/models/locale.model';
import { $isDark, $theme } from '@/shared/models/theme.model';

/** Theme is a single morphing icon: the sun collapses into a crescent and back. */
export const ThemeToggle = reatomComponent<{ className?: string }>(({ className, ctx }) => {
  const locale = ctx.spy($locale);
  const isDark = ctx.spy($isDark);

  return (
    <Classic
      toggled={isDark}
      duration={400}
      data-testid="theme-toggle"
      aria-label={m['theme.toggle']({}, { locale })}
      title={isDark ? m['theme.light']({}, { locale }) : m['theme.dark']({}, { locale })}
      className={[
        `inline-flex size-8 items-center justify-center rounded-lg text-[18px] text-fd-muted-foreground
        transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fd-ring`,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={(event) => {
        // the reveal starts from the click, or from the middle of the button for keyboards
        const rect = event.currentTarget.getBoundingClientRect();
        const fromCursor = event.clientX !== 0 || event.clientY !== 0;

        $theme.toggle(
          ctx,
          fromCursor
            ? { x: event.clientX, y: event.clientY }
            : { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
        );
      }}
    />
  );
}, 'ThemeToggle');
