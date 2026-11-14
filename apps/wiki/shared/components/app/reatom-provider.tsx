'use client';

import { reatomContext, useCreateCtx } from '@reatom/npm-react';
import type { ReactNode } from 'react';
import type { Server } from '@/lib/content/default-server';
import type { Theme } from '@/lib/theme';
import { $servers, $serverSlugs } from '@/shared/models/servers.model';
import { $theme } from '@/shared/models/theme.model';

/**
 * Creates one Reatom context per request/render and seeds it with everything the
 * header needs on the first paint: the theme from the cookie, the server list and
 * the page slugs per server. SSR markup and the first client render agree.
 */
export function ReatomProvider({
  children,
  initialTheme,
  servers,
  slugs,
}: {
  children: ReactNode;
  initialTheme: Theme;
  servers: Server[];
  slugs: Record<string, string[]>;
}) {
  const ctx = useCreateCtx((ctx) => {
    $theme(ctx, initialTheme);
    $servers(ctx, servers);
    $serverSlugs(ctx, slugs);
  });

  return <reatomContext.Provider value={ctx}>{children}</reatomContext.Provider>;
}
