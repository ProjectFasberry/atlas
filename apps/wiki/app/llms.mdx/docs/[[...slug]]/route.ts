import { notFound } from 'next/navigation';
import { getPage, pageUrl } from '@/lib/content/pages';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: RouteContext<'/llms.mdx/docs/[[...slug]]'>) {
  const { slug } = await params;
  const pageSlug = (slug ?? []).slice(0, -1).join('/');
  const page = await getPage(pageSlug);
  if (!page) notFound();

  return new Response(`# ${page.title} (${pageUrl(pageSlug)})\n\n${page.markdown}\n`, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });
}
