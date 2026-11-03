import { notFound } from 'next/navigation';
import { getLocalizedPage, pageUrl } from '@/lib/content/pages';
import { getLocale } from '@/lib/i18n/locale';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: RouteContext<'/llms.mdx/docs/[[...slug]]'>) {
  const { slug } = await params;
  const pageSlug = (slug ?? []).slice(0, -1).join('/');
  const page = await getLocalizedPage(pageSlug, await getLocale());
  if (!page) notFound();

  return new Response(`# ${page.title} (${pageUrl(pageSlug)})\n\n${page.markdown}\n`, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });
}
