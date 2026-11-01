import { useConfig } from 'vike-solid/useConfig';
import type { PageContextServer } from 'vike/types';
import { getUrl, getStaticObject, wrapTitle } from '@/shared/lib/helpers';
import { translate } from '@/shared/locales/helpers';
import { mainClient } from '@/shared/api/client';

const image = getStaticObject("background", "main_background.png")

export type Data = Awaited<ReturnType<typeof data>>

export async function data(pageCtx: PageContextServer) {
  const config = useConfig()

  const headers = pageCtx.headers;
  if (!headers) return;

  const [tags, content] = await Promise.all([
    mainClient.GET("/rules/tags", { headers }).then(r => r.data?.data ?? []),
    mainClient.GET("/rules/list", { headers }).then(r => r.data?.data ?? []),
  ])

  const title = wrapTitle(translate["pages.rules.title"]());
  const description = translate["pages.rules.description"]();
  const descriptionMore = translate["pages.rules.description-additional"]();

  config({
    title,
    description,
    Head: (
      <>
        <link rel="canonical" href={getUrl(pageCtx)} />
        <meta property="og:url" content={getUrl(pageCtx)} />
        <meta property="og:title" content={description} />
        <meta property="og:description" content={descriptionMore} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={description} />
        <meta property="og:image" content={image} />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:title" content={description} />
        <meta name="twitter:description" content={descriptionMore} />
        <meta name="twitter:image" content={image} />
        <meta property="twitter:image:type" content="image/jpeg" />
        <meta property="twitter:image:width" content="1200" />
        <meta property="twitter:image:height" content="630" />
      </>
    )
  })

  return {
    data: {
      tags,
      content
    }
  }
}
