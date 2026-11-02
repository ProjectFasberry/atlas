'use client';

import { reatomContext, useCreateCtx } from '@reatom/npm-react';
import type { ReactNode } from 'react';
import type { Theme } from '@/lib/theme';
import { $theme } from '@/shared/models/theme.model';

/**
 * Creates one Reatom context per request/render and seeds it with the theme from
 * the cookie that the server already put on `<html>`, so the SSR markup and the
 * first client render agree.
 */
export function ReatomProvider({
  children,
  initialTheme,
}: {
  children: ReactNode;
  initialTheme: Theme;
}) {
  const ctx = useCreateCtx((ctx) => {
    $theme(ctx, initialTheme);
  });

  return <reatomContext.Provider value={ctx}>{children}</reatomContext.Provider>;
}
