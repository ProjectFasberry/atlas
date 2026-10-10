import { client } from "@/shared/lib/client-wrapper";
import { logRouting } from "@/shared/lib/log";
import { getStaticImage } from "@/shared/lib/helpers";
import { getNotExistUrlByEntity, wrapTitle } from "@/shared/lib/helpers";
import { useConfig } from "vike-react/useConfig";
import { render } from "vike/abort";
import { type PageContextServer } from "vike/types";
import { createCtx, type Ctx } from "@reatom/framework";
import { snapshots } from "@/shared/models/ssr";
import { newsSingleState } from "@/shared/components/app/news/models/news-single.model";

export type Data = Awaited<ReturnType<typeof data>>;
export type News = ExtractApiData<"getNewsById">["data"]

const image = (url: News["imageUrl"]) => getStaticImage(url.slice(1));

function metadata(
  news: News
) {
  return {
    title: wrapTitle(news.title),
    description: news.description.slice(0, 256),
    image: image(news.imageUrl)
  }
}

async function init(ctx: Ctx, pageCtx: PageContextServer) {
  const headers = pageCtx.headers ?? undefined;
  const id = pageCtx.routeParams.id

  const news = await client<News>(`news/${id}`, { headers }).exec().catch(e => {
    console.error("News error", e)
    return null;
  })

  if (!news) throw render(getNotExistUrlByEntity("default"))

  return newsSingleState.data(ctx, news)!
}

export async function data(pageCtx: PageContextServer) {
  const config = useConfig()

  logRouting(pageCtx.urlPathname, "data");

  const ctx = createCtx()

  const result = await init(ctx, pageCtx)
  config(metadata(result))

  pageCtx.snapshot = snapshots.merge(ctx, pageCtx)
}
