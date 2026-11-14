import { Avatar } from "@/shared/ui/avatar"
import { pageState } from "@/shared/models/page-context.model"
import { reatomComponent, useAtom } from "@reatom/npm-react"
import { Typography } from "@/shared/ui/typography"
import { dayjs } from "@/shared/lib/dayjs"
import { createPageModel } from "@/shared/lib/events"
import { users, type PrivatedUser } from "@/shared/components/app/private/models/users.model"
import { Button } from "@/shared/ui/button"
import { currentUserState } from "@/shared/models/current-user/index.model"
import { PageLoader } from "@/shared/ui/page-loader"
import { BackButton } from "@/shared/ui/back-button"
import { ClientOnly } from "vike-react/ClientOnly"
import { lazy } from "react"

const ReactSkinview3d = lazy(() => import("react-skinview3d").then((m) => ({ default: m.ReactSkinview3d })));

const UserInfo = reatomComponent(({ ctx }) => {
  if (ctx.spy(users.fetchSingle.statusesAtom).isPending) return <PageLoader />

  const data = ctx.spy(users.fetchSingle.dataAtom);
  if (!data) return null;

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex sm:flex-row flex-col w-full gap-4 items-start">
      <div className="flex flex-col items-start w-full sm:w-[100%-300px] h-full">
        <Avatar url={data.avatar} nickname={data.nickname} className="h-20 w-20 mb-4" />
        <Typography>
          ID: {data.player?.id ?? "Unregistered"}
        </Typography>
        <Typography>
          Никнейм: {data.nickname} ({data.lower_case_nickname})
        </Typography>
        Регистрация: {data.created_at ? dayjs(data.created_at.toString()).format("DD.MM.YYYY hh:mm") : "none"}
        <Typography>
          UUID: {data.uuid}
        </Typography>
        <Typography>
          Роль: {data.role ? `${data.role.name} ${data.role.id}` : `none`}
        </Typography>
      </div>
      <div className="flex w-full bg-neutral-900 h-[390px] rounded-lg p-2 sm:w-[300px]">
        {data.skin?.[0].skin_url ? (
          <ClientOnly>
            <ReactSkinview3d
              skinUrl={data.skin[0].skin_url}
              height="390"
              width="300"
              options={{ zoom: 0.8 }}
            />
          </ClientOnly>
        ) : (
          <span className="m-auto text-neutral-400">Скина нет</span>
        )}
      </div>
      </div>
      {ctx.spy(currentUserState.perms).includes("skins.moderate") && data.skin?.length ? (
        <SkinsModeration nickname={data.nickname} skins={data.skin} />
      ) : null}
    </div>
  )
}, "UserInfo")

const SkinsModeration = reatomComponent<{ nickname: string, skins: NonNullable<PrivatedUser["skin"]> }>(({
  ctx, nickname, skins
}) => (
  <div className="flex flex-col gap-2 w-full max-w-2xl">
    <Typography className="font-semibold">Скины</Typography>
    {skins.map((skin) => (
      <div
        key={skin.skin_identifier}
        className="flex items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-900/40 px-3 py-2"
      >
        <div className="flex flex-col min-w-0">
          <Typography className="text-sm truncate">{skin.skin_identifier}</Typography>
          <Typography className="text-xs text-neutral-500">
            {dayjs(skin.timestamp * 1000).format("DD.MM.YYYY HH:mm")}
          </Typography>
        </div>
        <Button
          background="default"
          className="h-8 px-3 text-xs"
          disabled={ctx.spy(users.rejectSkin.statusesAtom).isPending}
          onClick={() => users.rejectSkin(ctx, { nickname, skinName: skin.skin_identifier })}
        >
          Отклонить
        </Button>
      </div>
    ))}
    <Button
      background="default"
      className="h-9 px-3 text-sm w-fit"
      disabled={ctx.spy(users.rejectAllSkins.statusesAtom).isPending}
      onClick={() => users.rejectAllSkins(ctx, nickname)}
    >
      Отклонить все
    </Button>
  </div>
), "SkinsModeration")

const page = createPageModel({
  name: "users",
  hooks: {
    onSpy: (ctx, dataAtom, routeParams) => {
      users.fetchSingle(ctx, routeParams?.nickname ?? "")
    },
  },
  spyedAtom: pageState.routeParams
})

export default function Page() {
  const [_] = useAtom(page.dataAtom)

  return (
    <div className="flex flex-col w-full gap-4 justify-center h-full">
      <BackButton />
      <UserInfo />
    </div>
  )
}
