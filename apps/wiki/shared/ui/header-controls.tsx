'use client';

import { ThemeToggle } from '@/shared/components/theme/theme-toggle';
import { UserMenu } from '@/shared/components/app/user-menu';
import { LanguageMenu } from '@/shared/ui/language-menu';
import { ServerSwitcher } from '@/shared/ui/server-switcher';

/** Header and drawer controls: server, language, theme, then the signed-in user. */
export function HeaderControls() {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <ServerSwitcher />
      <LanguageMenu />
      <ThemeToggle />
      <UserMenu />
    </div>
  );
}
