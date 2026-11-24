import { useConfig } from 'vike-solid/useConfig';
import type { PageContextServer } from 'vike/types';
import { getStaticObject, getUrl, wrapTitle } from '@/shared/lib/helpers';
import { translate } from '@/shared/locales/helpers';
import { apiRequestHeaders } from '@/shared/api/server';
import { resolvePageContent, type SiteLocale } from '@/shared/api/site';
import { getLocale } from '@/paraglide/runtime';

const image = getStaticObject("community", "dragon_dead.webp")

export type Data = { content: unknown; locale: SiteLocale; canEdit: boolean; canPublish: boolean }

export async function data(pageCtx: PageContextServer): Promise<Data> {
  const config = useConfig();

  const locale = getLocale()
  const { content, canEdit, canPublish } = await resolvePageContent(
    "support",
    locale,
    apiRequestHeaders(pageCtx),
  );

  const title = wrapTitle(translate["pages.support.title"]());
  const description = translate["pages.support.description"]()

  config({
    title,
    description,
    Head: (
      <>
        <link rel="canonical" href={getUrl(pageCtx)} />
        <meta property="og:url" content={getUrl(pageCtx)} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={title} />
        <meta property="og:image" content={image} />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={image} />
        <meta property="twitter:image:type" content="image/jpeg" />
        <meta property="twitter:image:width" content="1200" />
        <meta property="twitter:image:height" content="630" />
      </>
    )
  })

  return { content, locale, canEdit, canPublish }
}
