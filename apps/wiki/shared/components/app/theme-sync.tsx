'use client';

import { reatomComponent } from '@reatom/npm-react';
import { $theme, type Theme } from '@/shared/models/theme.model';

/**
 * Seeds `$theme` with the server-resolved theme before the header renders. Only a
 * null atom is filled: after the first paint the toggle owns it, so re-seeding on
 * a later render would put the stale server value back.
 */
export const ThemeSync = reatomComponent<{ theme: Theme }>(({ ctx, theme }) => {
  if (ctx.get($theme) === null) $theme(ctx, theme);
  return null;
});
