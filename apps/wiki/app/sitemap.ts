import type { MetadataRoute } from 'next';
import { listPages } from '@/lib/pages';
import { siteUrl } from '@/lib/shared';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = await listPages();

  return pages.map((page) => ({
    url: page.slug ? `${siteUrl}/${page.slug}` : siteUrl,
    lastModified: new Date(page.updatedAt),
    changeFrequency: 'weekly',
    priority: page.slug === '' ? 1 : 0.7,
  }));
}
