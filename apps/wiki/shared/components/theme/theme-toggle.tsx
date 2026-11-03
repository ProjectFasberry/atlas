'use client';

import { reatomComponent } from '@reatom/npm-react';
import { IconMoonFilled, IconSunFilled } from '@tabler/icons-react';
import { m } from '@/paraglide/messages';
import { $locale } from '@/shared/models/locale.model';
import { $isDark, $theme } from '@/shared/models/theme.model';
import { Segmented } from '@/shared/ui/segmented';

export const ThemeToggle = reatomComponent<{ className?: string }>(({ className, ctx }) => {
  const locale = ctx.spy($locale);
  const isDark = ctx.spy($isDark);

  return (
    <Segmented
      label={m['theme.toggle']({}, { locale })}
      testId="theme-switch"
      value={isDark ? 'dark' : 'light'}
      className={className}
      options={[
        {
          value: 'light',
          title: m['theme.light']({}, { locale }),
          label: <IconSunFilled className="size-4" aria-hidden />,
        },
        {
          value: 'dark',
          title: m['theme.dark']({}, { locale }),
          label: <IconMoonFilled className="size-4" aria-hidden />,
        },
      ]}
      onSelect={(value, event) => {
        if (value === (isDark ? 'dark' : 'light')) return;

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
});
