import { useConfig } from 'vike-solid/useConfig';
import type { PageContextServer } from 'vike/types';
import { getUrl, wrapTitle } from '@/shared/lib/helpers';
import { translate } from '@/shared/locales/helpers';

export async function data(pageCtx: PageContextServer) {
  const config = useConfig()

  const title = wrapTitle(translate["pages.status.title"]());
  const description = translate["pages.status.description"]();

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
      </>
    )
  })
}
