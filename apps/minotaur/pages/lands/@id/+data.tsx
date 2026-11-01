import { dayjs } from "@/shared/lib/dayjs"
import { wrapTitle } from "@/shared/lib/helpers";
import { useConfig } from "vike-react/useConfig";
import { type PageContextServer } from "vike/types";
import { getStaticImage } from "@/shared/lib/helpers";
import { logRouting } from "@/shared/lib/log";
import { land } from "@/shared/components/app/land/models/land.model";
import { createCtx } from "@reatom/framework";
import { snapshots } from "@/shared/models/ssr";

const image = getStaticImage("arts/adventure-in-blossom.jpg")

export type Land = ExtractApiData<"getServerLandsByUlid">["data"]
export type Data = Awaited<ReturnType<typeof data>>;

function metadata(
  land: Land,
  pageCtx: PageContextServer
) {
  const title = wrapTitle(land.name.slice(0, 64))
  const created_at = dayjs(land.created_at.toString()).format("DD MMM YYYY");
  // todo: i18n meta
  const description = `
    Территория ${land.name}. Создана ${created_at}. ${land.members.length} участников
  `
  const keywords = `
    ${land.name}, fasberry, fasberry page, территория ${land.name},
    land, fasberry land, fasberry ${land.name}
  `

  return {
    title,
    description,
    image,
    Head: (
      <>
        <meta property="og:url" content={pageCtx.urlPathname} />
        <meta property="og:type" content="website" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="keywords" content={keywords} />
      </>
    ),
  }
}

export async function data(pageCtx: PageContextServer) {
  const config = useConfig()

  logRouting(pageCtx.urlPathname, "data");

  const ctx = createCtx()
  const result = await land.init(ctx, pageCtx);

  config(metadata(result, pageCtx))

  pageCtx.snapshot = snapshots.merge(ctx, pageCtx)
}
