import { DocsPage } from 'fumadocs-ui/layouts/notebook/page';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getEditor } from '@/lib/auth';
import { getPage, renderPageHtml } from '@/lib/pages';
import { getPageImageUrl, getPageMarkdownUrl } from '@/lib/shared';
import { WikiPage } from '@/shared/components/wiki/wiki-page';
import { pageIcon } from '@/shared/ui/page-icons';

export const dynamic = 'force-dynamic';

export default async function Page(props: PageProps<'/[[...slug]]'>) {
  const params = await props.params;
  const slug = (params.slug ?? []).join('/');
  const page = await getPage(slug);
  if (!page) notFound();

  const { html, toc } = renderPageHtml(page);
  const markdownUrl = getPageMarkdownUrl(slug).url;
  const editor = await getEditor();

  return (
    <DocsPage toc={toc} full={page.slug === '' ? true : undefined}>
      <WikiPage
        slug={slug}
        title={page.title}
        description={page.description}
        html={html}
        markdownUrl={markdownUrl}
        canEdit={Boolean(editor)}
        icon={pageIcon(slug)}
      />
    </DocsPage>
  );
}

export async function generateMetadata(props: PageProps<'/[[...slug]]'>): Promise<Metadata> {
  const params = await props.params;
  const slug = (params.slug ?? []).join('/');
  const page = await getPage(slug);
  if (!page) notFound();

  return {
    title: page.title,
    description: page.description,
    openGraph: {
      images: getPageImageUrl(slug).url,
    },
  };
}
