import { generateOGImage } from 'fumadocs-ui/og';
import { notFound } from 'next/navigation';
import { getPage } from '@/lib/pages';
import { appName } from '@/lib/shared';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: RouteContext<'/og/docs/[...slug]'>) {
  const { slug } = await params;
  const pageSlug = (slug ?? []).slice(0, -1).join('/');
  const page = await getPage(pageSlug);
  if (!page) notFound();

  return generateOGImage({
    title: page.title,
    description: page.description,
    site: appName,
  });
}
