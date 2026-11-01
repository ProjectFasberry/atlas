import { useConfig } from 'vike-solid/useConfig';
import type { PageContextServer } from 'vike/types';
import { getUrl, wrapTitle, getStaticObject } from '@/shared/lib/helpers';
import { translate } from '@/shared/locales/helpers';

const image = getStaticObject("background", "rules_background.png")

export async function data(pageCtx: PageContextServer) {
  const config = useConfig()

  const title = wrapTitle(translate["pages.start-play.title"]());
  const description = translate["pages.start-play.description"]()

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
}
