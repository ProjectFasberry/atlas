'use client';

import { ThemeToggle } from '@/shared/components/theme/theme-toggle';
import { LanguageToggle } from './language-toggle';

/** Header controls: the language switch sits right next to the theme switch. */
export function HeaderControls() {
  return (
    <div className="flex items-center gap-2">
      <LanguageToggle />
      <ThemeToggle />
    </div>
  );
}
