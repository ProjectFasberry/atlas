import { useConfig } from 'vike-solid/useConfig';
import type { PageContextServer } from 'vike/types';
import { getUrl, wrapTitle } from '@/shared/lib/helpers';
import { translate } from '@/shared/locales/helpers';

export async function data(pageCtx: PageContextServer) {
  const config = useConfig();

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
}
