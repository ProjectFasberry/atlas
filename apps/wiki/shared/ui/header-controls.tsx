'use client';

import { ThemeToggle } from '@/shared/components/theme/theme-toggle';
import { UserMenu } from '@/shared/components/app/user-menu';
import { LanguageToggle } from '@/shared/ui/language-toggle';

/** Header controls: language and theme switches, then the signed-in user badge. */
export function HeaderControls() {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <LanguageToggle />
      <ThemeToggle />
      <UserMenu />
    </div>
  );
}
