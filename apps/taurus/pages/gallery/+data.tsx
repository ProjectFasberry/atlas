import { getUrl, wrapTitle } from '@/shared/lib/helpers';
import { translate } from '@/shared/locales/helpers';
import { useConfig } from 'vike-solid/useConfig';
import type { PageContextServer } from 'vike/types';
import { fetchGallery, GALLERY_PAGE_SIZE, type GalleryPage } from '@/shared/api/gallery';
import { getLocale } from '@/paraglide/runtime';

export type Data = {
  gallery: GalleryPage | null
}

export async function data(pageCtx: PageContextServer): Promise<Data> {
  const config = useConfig()

  const title = wrapTitle(translate['pages.gallery.title']());
  const description = translate['pages.gallery.description']();

  // The first page is rendered on the server; the client appends the rest on
  // scroll. A failed request leaves the grid to fetch on mount.
  const gallery = await fetchGallery({
    locale: getLocale(),
    limit: GALLERY_PAGE_SIZE,
  }).catch(() => null)

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

  return { gallery }
}
