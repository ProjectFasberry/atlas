import { useConfig } from 'vike-solid/useConfig';
import type { PageContextServer } from 'vike/types';
import { getUrl, getStaticObject, wrapTitle } from '@/shared/lib/helpers';
import { translate } from '@/shared/locales/helpers';
import { mainClient } from '@/shared/api/client';
import { apiRequestHeaders } from '@/shared/api/server';

const image = getStaticObject("backgrounds", "main_background.png")

export type Data = Awaited<ReturnType<typeof data>>

export async function data(pageCtx: PageContextServer) {
  const config = useConfig()

  const headers = apiRequestHeaders(pageCtx);

  const [tagsResult, contentResult] = await Promise.all([
    mainClient.GET("/rules/tags", { headers }),
    mainClient.GET("/rules/list", { headers }),
  ]).catch((e) => {
    console.error("[rules] data fetch threw", e);
    return [null, null] as const;
  });

  if (!tagsResult?.data) console.error("[rules] tags request returned no data");
  if (!contentResult?.data) console.error("[rules] list request returned no data");

  const tags = tagsResult?.data?.data ?? [];
  const content = contentResult?.data?.data ?? [];

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
      tags: tags ?? [],
      content: content ?? null
    }
  }
}
