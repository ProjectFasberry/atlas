import { notFound } from 'next/navigation';
import { getLocalizedPage, pageUrl } from '@/lib/content/pages';
import { getServers, resolveRoute } from '@/lib/content/servers';
import { getLocale } from '@/lib/i18n/locale';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: RouteContext<'/llms.mdx/docs/[[...slug]]'>) {
  const { slug } = await params;
  const segments = (slug ?? []).slice(0, -1);
  const { server, slug: pageSlug } = resolveRoute(segments, await getServers());
  const page = await getLocalizedPage(server, pageSlug, await getLocale());
  if (!page) notFound();

  return new Response(
    `# ${page.title} (${pageUrl(server, pageSlug)})\n\n${page.markdown}\n`,
    {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
      },
    },
  );
}
