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
import { getServers, resolveRoute } from '@/lib/content/servers';
import { DEFAULT_SERVER } from '@/lib/content/default-server';
import { publicEnv } from '@/lib/env/public';
import { getLocale } from '@/lib/i18n/locale';
import { articleJsonLd, homeJsonLd, serializeJsonLd } from '@/lib/seo/jsonld';
import { pageMetadata } from '@/lib/seo/metadata';
import { DEFAULT_OG_IMAGE } from '@/lib/seo/site';
import { m } from '@/paraglide/messages';
import { WikiPage } from '@/shared/components/wiki/wiki-page';
import { pageIcon } from '@/shared/ui/page-icons';

export const dynamic = 'force-dynamic';

export default async function Page(props: PageProps<'/[[...slug]]'>) {
  const params = await props.params;
  const segments = params.slug ?? [];
  const servers = await getServers();
  const { server, slug } = resolveRoute(segments, servers);
  const locale = await getLocale();
  const source = await getPage(server, slug);

  if (!source) {
    // a server from the switcher may have no pages yet, its root is still reachable
    if (slug !== '') notFound();

    const name = servers.find((item) => item.id === server)?.name ?? server;

    return (
      <DocsPage toc={[]} full>
        <h1 className="text-[1.75em] font-semibold leading-tight">{name}</h1>
        <p className="mt-3 text-fd-muted-foreground">
          {m['server.empty.description']({ name }, { locale })}
        </p>
      </DocsPage>
    );
  }

  const page = (await getLocalizedPage(server, slug, locale)) ?? source;
  const { html, toc } = renderPageHtml(page);
  const markdownUrl = getPageMarkdownUrl(server, slug).url;
  const editor = await getEditor();
  const url = `${publicEnv.siteUrl}${pageUrl(server, slug)}`;
  const description = pageDescription(page);
  const image = `${publicEnv.siteUrl}${getPageImageUrl(server, slug).url}`;

  const jsonLd =
    slug === '' && server === DEFAULT_SERVER
      ? homeJsonLd(description)
      : articleJsonLd({
          title: page.title,
          description,
          url,
          image,
          updatedAt: page.updatedAt,
        });

  return (
    <DocsPage toc={toc} full={slug === '' ? true : undefined}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <WikiPage
        server={server}
        slug={slug}
        title={page.title}
        description={page.description}
        html={html}
        editSource={{ title: source.title, description: source.description, html: source.html }}
        markdownUrl={markdownUrl}
        canEdit={Boolean(editor)}
        icon={pageIcon(slug)}
      />
    </DocsPage>
  );
}

export async function generateMetadata(props: PageProps<'/[[...slug]]'>): Promise<Metadata> {
  const params = await props.params;
  const segments = params.slug ?? [];
  const servers = await getServers();
  const { server, slug } = resolveRoute(segments, servers);
  const locale = await getLocale();
  const page = (await getLocalizedPage(server, slug, locale)) ?? (await getPage(server, slug));

  if (!page) {
    if (slug !== '') notFound();

    const name = servers.find((item) => item.id === server)?.name ?? server;

    return pageMetadata({
      title: name,
      description: m['server.empty.description']({ name }, { locale }),
      image: DEFAULT_OG_IMAGE,
      url: pageUrl(server, slug),
      updatedAt: new Date(),
    });
  }

  const description = pageDescription(page);

  return pageMetadata({
    title: page.title,
    description,
    image: getPageImageUrl(server, slug).url,
    url: pageUrl(server, slug),
    updatedAt: page.updatedAt,
  });
}
