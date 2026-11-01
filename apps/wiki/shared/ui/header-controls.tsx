'use client';

import { ThemeToggle } from '@/shared/components/theme/theme-toggle';
import { LanguageToggle } from '@/shared/ui/language-toggle';

/** Header controls: the language switch sits right next to the theme switch. */
export function HeaderControls() {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <LanguageToggle />
      <ThemeToggle />
    </div>
  );
}
