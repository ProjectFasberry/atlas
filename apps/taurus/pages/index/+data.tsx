import { useConfig } from 'vike-solid/useConfig';
import type { PageContextServer } from 'vike/types';
import { getUrl, wrapTitle } from '@/shared/lib/helpers';
import { translate } from '@/shared/locales/helpers';
import {
  asHomeContent, fetchHomeContent, fetchSiteAccess, fetchSiteDraft,
  type HomeContent, type SiteEditMeta,
} from '@/shared/api/site';
import { apiRequestHeaders } from '@/shared/api/server';
import { getLocale } from '@/paraglide/runtime';

export type Data = {
  content: HomeContent | null
  edit: SiteEditMeta | null
}

export async function data(pageCtx: PageContextServer): Promise<Data> {
  const config = useConfig();

  const locale = getLocale();
  const headers = apiRequestHeaders(pageCtx);
  const wantsEdit = pageCtx.urlParsed.search.edit === "1";

  let content: HomeContent | null = null;
  let edit: SiteEditMeta | null = null;

  // Editors open `?edit=1`: the draft comes from the same cookie session the
  // panel uses, never from a token in the URL.
  if (wantsEdit) {
    const access = await fetchSiteAccess(headers);

    if (access?.canEdit) {
      const draft = await fetchSiteDraft("home", locale, headers);

      content = asHomeContent(draft?.content ?? null);
      edit = {
        active: true,
        canPublish: access.canPublish,
        version: draft?.version ?? 0,
        updatedAt: draft?.updatedAt ?? null,
        locale: draft?.locale ?? locale,
      };
    }
  }

  if (!edit) content = await fetchHomeContent(locale, headers);

  const title = wrapTitle(translate['pages.index.title']());
  const description = translate['pages.index.description']();

  const gameLd = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: "Fasberry",
    url: getUrl(pageCtx),
    description,
    genre: ["Sandbox", "Survival", "MMORPG"],
    gamePlatform: "PC",
    operatingSystem: "Windows, macOS, Linux",
    playMode: "MultiPlayer",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "RUB",
      availability: "https://schema.org/InStock",
    },
  }

  config({
    title,
    description,
    Head: (
      <>
        <link rel="canonical" href={getUrl(pageCtx)} />
        <meta property="og:url" content={getUrl(pageCtx)} />
        <meta property="og:title" content={title} />
        <meta property="og:site_name" content={title} />
        <meta name="twitter:title" content={title} />
        {edit && <meta name="robots" content="noindex, nofollow" />}
        <script type="application/ld+json" innerHTML={JSON.stringify(gameLd)} />
      </>
    )
  })

  return { content, edit };
}
