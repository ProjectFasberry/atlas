'use client';

import { reatomComponent } from '@reatom/npm-react';
import type { Server } from '@/lib/content/default-server';
import { $servers, $serverSlugs } from '@/shared/models/servers.model';

/** Puts the server list and the page slugs per server into the atoms for the switcher. */
export const ServersSync = reatomComponent<{
  servers: Server[];
  slugs: Record<string, string[]>;
}>(({ ctx, servers, slugs }) => {
  if (ctx.spy($servers) !== servers) $servers(ctx, servers);
  if (ctx.spy($serverSlugs) !== slugs) $serverSlugs(ctx, slugs);
  return null;
});
