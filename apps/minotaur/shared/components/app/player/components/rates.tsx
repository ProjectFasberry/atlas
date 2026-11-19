import { reatomComponent } from "@reatom/npm-react"
import { Avatar } from "@/shared/ui/avatar"
import { Button } from "@/shared/ui/button"
import { Icon } from "@/shared/ui/icon"
import { Link } from "@/shared/components/config/link/link"
import { createLink } from "@/shared/components/config/link/link.model"
import { Typography } from "@/shared/ui/typography"
import { Skeleton } from "@/shared/ui/skeleton"
import { Noop } from "@/shared/ui/noop"
import { ErrorBlock } from "@/shared/ui/error-block"
import { BackButton } from "@/shared/ui/back-button"
import { currentUserState } from "@/shared/models/current-user/index.model"
import { userState } from "@/shared/models/app/index.model"
import { pageState } from "@/shared/models/page-context.model"
import { isEmptyArray } from "@/shared/lib/utils"
import { dayjs } from "@/shared/lib/dayjs"
import { translate } from "@/shared/locales/helpers"
import { clsx } from "cnfast"
import { player } from "../models/player.model"

type RateUser = ExtractApiData<"getRateListByNickname">["data"]["data"][number]

const VoterCard = reatomComponent<RateUser>(({ ctx, initiator, avatar, created_at }) => {
  const currentNickname = ctx.spy(currentUserState)?.nickname
  const isSelf = currentNickname?.toLowerCase() === initiator.toLowerCase()
  const ratedAt = dayjs(created_at).fromNow()

  return (
    <Link
      href={createLink("player", initiator)}
      className={clsx(
        "group flex min-w-0 items-center gap-3 rounded-xl border bg-neutral-900",
        "p-3 duration-150 hover:bg-neutral-800",
        isSelf ? "border-green-500/40" : "border-transparent",
      )}
    >
      <Avatar nickname={initiator} url={avatar} className="size-12 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <Typography className="truncate text-sm font-semibold">{initiator}</Typography>
          {isSelf && (
            <span className="shrink-0 rounded bg-green-500/15 px-1.5 py-0.5
              text-[10px] font-semibold uppercase text-green-400">
              {translate["ratings.rates.you"]()}
            </span>
          )}
        </div>
        <Typography
          color="gray"
          className="truncate text-xs"
          title={dayjs(created_at).format("DD.MM.YYYY HH:mm")}
        >
          {translate["ratings.rates.rated-at"]({ date: ratedAt })}
        </Typography>
      </div>
      <Icon name="sprite:heart" className="size-4 shrink-0 fill-red-500/70 text-red-400" />
    </Link>
  )
}, "VoterCard")

const RatesSkeleton = () => Array.from({ length: 6 }).map((_, idx) => (
  <Skeleton key={idx} className="h-[70px] w-full" />
))

const RatesGuest = ({ nickname }: { nickname: string }) => (
  <div className="flex flex-col items-center gap-3 rounded-xl bg-neutral-900 p-6 text-center">
    <Icon name="sprite:heart" className="size-8 text-red-400" />
    <Typography color="gray" className="text-sm">
      {translate["ratings.rates.auth"]({ nickname })}
    </Typography>
    <Link
      href="/auth"
      className="rounded-xl bg-neutral-50 px-4 py-2 text-sm font-semibold
        text-neutral-950 duration-150 hover:bg-neutral-200"
    >
      {translate["ratings.rates.auth-action"]()}
    </Link>
  </div>
)

const RatesError = reatomComponent<{ nickname: string }>(({ ctx, nickname }) => (
  <div className="flex flex-col items-start gap-2">
    <ErrorBlock title={translate["ratings.rates.load-error"]()} raw />
    <Button
      background="default"
      className="h-8 text-xs font-semibold"
      onClick={() => player.rate.refetchAll(ctx, nickname)}
    >
      {translate["shared.retry"]()}
    </Button>
  </div>
), "RatesError")

const RateList = reatomComponent<{ nickname: string }>(({ ctx, nickname }) => {
  const isClientside = ctx.spy(pageState.isClientside)
  const isAuthed = ctx.spy(userState.isAuthed)

  if (!isClientside) return <RatesSkeleton />

  if (!isAuthed) return <RatesGuest nickname={nickname} />

  if (ctx.spy(player.rate.fetchList.statusesAtom).isPending) return <RatesSkeleton />

  if (ctx.spy(player.rate.fetchList.errorAtom)) return <RatesError nickname={nickname} />

  const rows = ctx.spy(player.rate.fetchList.dataAtom)?.data
  if (!rows || isEmptyArray(rows)) return <Noop title={translate["ratings.rates.empty"]()} />

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3
      auto-rows-auto w-full h-full">
      {rows.map((user) => <VoterCard key={user.initiator} {...user} />)}
    </div>
  )
}, "RateList")

export const PlayerRates = reatomComponent<{ nickname: string }>(({ ctx, nickname }) => {
  const count = ctx.spy(player.rate.fetchList.dataAtom)?.meta.count ?? 0

  return (
    <div className="flex flex-col gap-6 w-full h-full">
      <div className="flex flex-wrap items-center gap-2 w-full">
        <BackButton href={createLink("player", nickname)} />
        <Typography variant="title">
          {translate["ratings.rates.voters"]({ nickname })}
        </Typography>
        {count > 0 && (
          <span className="rounded-lg bg-neutral-800 px-2 py-0.5
            text-xs font-semibold text-neutral-300">
            {count}
          </span>
        )}
      </div>
      <RateList nickname={nickname} />
    </div>
  )
}, "PlayerRates")
