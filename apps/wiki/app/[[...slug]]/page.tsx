import { DocsPage } from 'fumadocs-ui/layouts/notebook/page';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getEditor } from '@/lib/auth';
import {
  getLocalizedPage,
  getPage,
  pageDescription,
  pageUrl,
  renderPageHtml,
} from '@/lib/content/pages';
import { getPageImageUrl, getPageMarkdownUrl } from '@/lib/content/routes';
import { publicEnv } from '@/lib/env/public';
import { getLocale } from '@/lib/i18n/locale';
import { articleJsonLd, homeJsonLd } from '@/lib/seo/jsonld';
import { pageMetadata } from '@/lib/seo/metadata';
import { WikiPage } from '@/shared/components/wiki/wiki-page';
import { pageIcon } from '@/shared/ui/page-icons';

export const dynamic = 'force-dynamic';

export default async function Page(props: PageProps<'/[[...slug]]'>) {
  const params = await props.params;
  const slug = (params.slug ?? []).join('/');
  const locale = await getLocale();
  const source = await getPage(slug);
  if (!source) notFound();

  const page = (await getLocalizedPage(slug, locale)) ?? source;
  const { html, toc } = renderPageHtml(page);
  const markdownUrl = getPageMarkdownUrl(slug).url;
  const editor = await getEditor();
  const url = `${publicEnv.siteUrl}${pageUrl(slug)}`;
  const description = pageDescription(page);
  const image = `${publicEnv.siteUrl}${getPageImageUrl(slug).url}`;

  const jsonLd =
    slug === ''
      ? homeJsonLd(description)
      : articleJsonLd({
          title: page.title,
          description,
          url,
          image,
          updatedAt: page.updatedAt,
        });

  return (
    <DocsPage toc={toc} full={page.slug === '' ? true : undefined}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
  const locale = await getLocale();
  const page = (await getLocalizedPage(slug, locale)) ?? (await getPage(slug));
  if (!page) notFound();

  const description = pageDescription(page);

  return pageMetadata({
    title: page.title,
    description,
    image: getPageImageUrl(slug).url,
    url: pageUrl(slug),
    updatedAt: page.updatedAt,
  });
}
