import { useConfig } from 'vike-solid/useConfig';
import type { PageContextServer } from 'vike/types';
import { getUrl, wrapTitle } from '@/shared/lib/helpers';
import { translate } from '@/shared/locales/helpers';
import { asHomeContent, type HomeContent } from '@/shared/api/site';
import { loadPageData, type EditablePageData } from '@/shared/api/page-data';
import { getLocale } from '@/paraglide/runtime';
import { fetchFaq, type FaqApiItem } from '@/shared/api/faq';

export type Data = EditablePageData & {
  content: HomeContent | null
  faq: FaqApiItem[]
}

export async function data(pageCtx: PageContextServer): Promise<Data> {
  const config = useConfig();

  const locale = getLocale();
  const [pageData, faq] = await Promise.all([
    loadPageData("home", pageCtx),
    fetchFaq("home", locale).catch(() => []),
  ]);
  const content = asHomeContent(pageData.content);

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
        <script type="application/ld+json" innerHTML={JSON.stringify(gameLd)} />
      </>
    )
  })

  return { ...pageData, content, faq };
}
