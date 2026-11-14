import type { MetadataRoute } from 'next';
import { listPages } from '@/lib/content/pages';
import { getServers, pageUrl } from '@/lib/content/servers';
import { publicEnv } from '@/lib/env/public';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const servers = await getServers();
  const listed = await Promise.all(
    servers.map(async (server) => ({ server: server.id, pages: await listPages(server.id) })),
  );

  return listed.flatMap(({ server, pages }) =>
    pages.map((page) => ({
      url: `${publicEnv.siteUrl}${pageUrl(server, page.slug)}`,
      lastModified: new Date(page.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: page.slug === '' ? 1 : 0.7,
    })),
  );
}
