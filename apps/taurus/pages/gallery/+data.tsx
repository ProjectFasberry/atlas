import { getUrl, wrapTitle } from '@/shared/lib/helpers';
import { translate } from '@/shared/locales/helpers';
import { useConfig } from 'vike-solid/useConfig';
import type { PageContextServer } from 'vike/types';

export async function data(pageCtx: PageContextServer) {
  const config = useConfig()

  const title = wrapTitle(translate['pages.gallery.title']());
  const description = translate['pages.gallery.description']();

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
