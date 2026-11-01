import type { MetadataRoute } from 'next';
import { listPages } from '@/lib/content/pages';
import { publicEnv } from '@/lib/env/public';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = await listPages();

  return pages.map((page) => ({
    url: page.slug ? `${publicEnv.siteUrl}/${page.slug}` : publicEnv.siteUrl,
    lastModified: new Date(page.updatedAt),
    changeFrequency: 'weekly',
    priority: page.slug === '' ? 1 : 0.7,
  }));
}
