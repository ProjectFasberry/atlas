'use client';

import { reatomComponent } from '@reatom/npm-react';
import { IconMoonFilled, IconSunFilled } from '@tabler/icons-react';
import { cn } from '@/lib/cn';
import { m } from '@/paraglide/messages';
import { $locale } from '@/shared/models/locale.model';
import { $isDark, $theme } from '@/shared/models/theme.model';

export const ThemeToggle = reatomComponent<{ className?: string }>(({ className, ctx }) => {
  const locale = ctx.spy($locale);
  const isDark = ctx.spy($isDark);

  return (
    <button
      type="button"
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const fromCursor = event.clientX !== 0 || event.clientY !== 0;

        $theme.toggle(
          ctx,
          fromCursor
            ? { x: event.clientX, y: event.clientY }
            : { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
        );
      }}
      data-theme-toggle=""
      aria-label={m['theme.toggle']({}, { locale })}
      className={cn('inline-flex items-center overflow-hidden rounded-full border p-1', className)}
    >
      <IconSunFilled
        className={cn(
          'size-6.5 rounded-full p-1.5 transition-colors',
          isDark ? 'text-fd-muted-foreground' : 'bg-fd-accent text-fd-accent-foreground',
        )}
      />
      <IconMoonFilled
        className={cn(
          'size-6.5 rounded-full p-1.5 transition-colors',
          isDark ? 'bg-fd-accent text-fd-accent-foreground' : 'text-fd-muted-foreground',
        )}
      />
    </button>
  );
});
