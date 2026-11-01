import { type PageContextServer } from "vike/types";
import { useConfig } from "vike-react/useConfig";
import { wrapTitle } from "@/shared/lib/helpers";
import { logRouting } from "@/shared/lib/log";
import { player, playerSsrModel } from "@/shared/components/app/player/models/player.model";;
import { dayjs } from "@/shared/lib/dayjs"
import { createCtx, type Ctx } from "@reatom/framework";
import { playerLands } from "@/shared/components/app/player/models/player-lands.model";
import { snapshots } from "@/shared/models/ssr";
import { getFromDictionary } from "@/shared/models/app/utils";

export type Player = ExtractApiData<"getServerPlayerByNickname">["data"]
export type Data = Awaited<ReturnType<typeof data>>;

function buildMetadataValues(ctx: Ctx, user: Player, pageCtx: PageContextServer) {
  const nickname = user.nickname;
  const reg = dayjs(user.meta.reg_date.toString()).format("DD MMM YYYY");
  const login = dayjs(user.meta.login_date.toString()).format("DD MMM YYYY");

  const group = getFromDictionary(ctx, user.group)

  return {
    title: wrapTitle(nickname),
    image: user.avatar ?? "",
    description: `
      Профиль игрока ${nickname}.
      Привилегия: ${group}.
      Играет с ${reg}. Последний вход: ${login}.
    `,
    url: pageCtx.urlPathname,
    nickname
  };
}

function buildMetadataHead({ title, nickname, description, image, url }: ReturnType<typeof buildMetadataValues>) {
  const keywords = `${nickname}, fasberry, fasberry page, профиль ${nickname}`

  return (
    <>
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image && (
        <>
          <link rel="preload" as="image" href={image} fetchPriority="high" />
        </>
      )}
      <meta name="keywords" content={keywords} />
    </>
  );
}

export async function data(pageCtx: PageContextServer) {
  const config = useConfig();

  logRouting(pageCtx.urlPathname, "data");

  const ctx = createCtx()
  const result = await player.init(ctx, pageCtx)
  const metaValues = buildMetadataValues(ctx, result, pageCtx);

  config({
    title: metaValues.title,
    image: metaValues.image,
    description: metaValues.description,
    Head: buildMetadataHead(metaValues)
  });

  await playerLands.init(ctx, pageCtx);

  pageCtx.snapshot = snapshots.merge(ctx, pageCtx, playerSsrModel.snapshotAtom)
}
