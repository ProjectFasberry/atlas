import type { ReactNode } from "react"
import { reatomComponent, useUpdate } from "@reatom/npm-react"
import { spawn } from "@reatom/framework"
import { toast } from "sonner"
import { env } from "@/shared/env"
import { belkoinImage, charismImage } from "@/shared/consts/images"
import { getStaticImage } from "@/shared/lib/helpers"
import { currentUserState } from "@/shared/models/current-user/index.model"
import { tasks } from "@/shared/components/app/tasks/models/tasks.model"
import { referralLinkUrl, referrals } from "@/shared/components/app/referrals/models/referrals.model"
import { serverStatus } from "@/shared/components/app/intro/models/intro.model"
import { formatDuration, formatNumber } from "@/shared/components/app/ratings/format"
import { newsState } from "@/shared/components/app/news/models/news.model"
import { Link } from "@/shared/components/config/link/link"
import { FormattedText } from "@/shared/components/app/land/components/land-title"
import { createLink } from "@/shared/components/config/link/link.model"
import { Avatar } from "@/shared/ui/avatar"
import { Button } from "@/shared/ui/button"
import { Icon } from "@/shared/ui/icon"
import { Skeleton } from "@/shared/ui/skeleton"
import { Typography } from "@/shared/ui/typography"
import { WalletChips } from "@/shared/components/app/wallet/components/wallet-chips"
import { home } from "../models/home.model"
import { homeFaq } from "../models/faq.model"
import { translate } from "@/shared/locales/helpers"

const HERO_IMAGE = getStaticImage("images/village_pillage.webp")

const Card = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`flex flex-col gap-2 rounded-xl bg-neutral-900 p-4 ${className}`}>
    {children}
  </div>
)

const CardTitle = ({ children, action }: { children: ReactNode; action?: ReactNode }) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
      {children}
    </span>
    {action}
  </div>
)

const cardActionClass = "text-xs text-green-400 hover:text-green-300"

export const HomeHero = reatomComponent(({ ctx }) => {
  const user = ctx.spy(currentUserState)
  const status = ctx.spy(serverStatus.fetch.dataAtom)

  const welcome = user
    ? translate["home.hero.welcome"]({ nickname: user.nickname })
    : translate["home.hero.brand"]()
  const title = user ? translate["home.hero.title_user"]() : translate["home.hero.title_guest"]()
  const text = user ? translate["home.hero.text_user"]() : translate["home.hero.text_guest"]()

  return (
    <div className="relative flex min-h-60 w-full
      flex-col overflow-hidden rounded-xl md:h-96 max-h-80">
      <div className="absolute inset-0 z-5 w-full
      bg-linear-to-r from-black/85 via-black/50 to-transparent" />
      <img
        src={HERO_IMAGE}
        alt=""
        draggable={false}
        className="absolute inset-0 z-4 h-full w-full select-none object-cover"
      />
      <div className="relative z-6 flex h-full w-full grow flex-col justify-between gap-4 p-4 lg:p-6">
        <div className="flex flex-col items-start gap-3">
          <span className="rounded-md bg-green-500/20 px-2
            py-0.5 text-[11px] font-semibold uppercase tracking-wide text-green-300">
            {welcome}
          </span>
          <Typography className="text-2xl font-[PIXY] leading-[1.1] lg:text-4xl">
            {title}
          </Typography>
          <Typography className="max-w-2xl text-sm leading-tight text-neutral-200 lg:text-base">
            {text}
          </Typography>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm text-neutral-300">
            <span className={`size-2 rounded-full ${status ? "bg-green-400" : "bg-neutral-500"}`} />
            <span>
              {translate["home.hero.online"]({ count: status?.proxy.online ?? 0 })}
            </span>
          </div>
          {user
            ? <HeroUserActions
                nickname={user.nickname}
                avatar={user.avatar}
                role={user.meta.role.name}
            />
            : <HeroGuestActions />
          }
        </div>
      </div>
    </div>
  )
}, "HomeHero")

const HeroUserActions = ({
  nickname, avatar, role
}: {
  nickname: string; avatar: string; role: string
}) => (
  <div className="flex flex-wrap items-center gap-2">
    <Link
      href={createLink("player", nickname)}
      className="flex items-center gap-2 rounded-lg bg-black/40 px-2 py-1"
    >
      <Avatar url={avatar} nickname={nickname} className="size-6" />
      <span className="text-sm font-semibold">{nickname}</span>
    </Link>
    <span className="rounded-lg bg-black/40 px-2 py-1 text-xs text-neutral-300">
      {role}
    </span>
    <a href={`${env.VITE_LANDING_URL}/start`} target="_blank" rel="noreferrer">
      <Button background="white" className="h-8 text-sm font-semibold">
        {translate["home.hero.play"]()}
      </Button>
    </a>
  </div>
)

const HeroGuestActions = () => (
  <div className="flex flex-wrap items-center gap-2">
    <Link href="/auth?type=register">
      <Button background="white" className="h-9 text-sm font-semibold">
        {translate["home.hero.register"]()}
      </Button>
    </Link>
    <a href={`${env.VITE_LANDING_URL}/start`} target="_blank" rel="noreferrer">
      <Button background="default" className="h-9 text-sm font-semibold">
        {translate["home.hero.download"]()}
      </Button>
    </a>
  </div>
)

const PlayerBalance = () => {
  return (
    <Card>
      <CardTitle>{translate["home.balance.title"]()}</CardTitle>
      <WalletChips size="lg" />
      <Link href="/store" className={cardActionClass}>
        {translate["home.balance.to_store"]()}
      </Link>
    </Card>
  )
}

const PlayerTasks = reatomComponent(({ ctx }) => {
  useUpdate((ctx) => { tasks.fetch(ctx) }, [])

  const data = ctx.spy(tasks.fetch.dataAtom)
  const pending = ctx.spy(tasks.fetch.statusesAtom).isPending

  if (pending && !data) {
    return (
      <Card>
        <CardTitle action={<Link href="/tasks" className={cardActionClass}>{translate["home.tasks.all"]()}</Link>}>
          {translate["home.tasks.title"]()}
        </CardTitle>
        <Skeleton className="h-12 w-full" />
      </Card>
    )
  }

  return (
    <Card>
      <CardTitle action={<Link href="/tasks" className={cardActionClass}>{translate["home.tasks.all"]()}</Link>}>
        {translate["home.tasks.title"]()}
      </CardTitle>
      {data?.data.length ? (
        <ul className="flex flex-col gap-1.5">
          {data.data.slice(0, 3).map((task) => (
            <li key={task.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate text-neutral-200">{task.title}</span>
              <span className="flex shrink-0 items-center gap-1 text-xs text-green-300">
                <img
                  src={task.reward_currency === "CHARISM" ? charismImage : belkoinImage}
                  alt={task.reward_currency}
                  className="size-3.5"
                />
                +{task.reward_value}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <span className="text-sm text-neutral-500">
          {translate["home.tasks.empty"]()}
        </span>
      )}
    </Card>
  )
}, "PlayerTasks")

const PlayerReferrals = reatomComponent(({ ctx }) => {
  useUpdate((ctx) => { referrals.stats(ctx) }, [])

  const stats = ctx.spy(referrals.stats.dataAtom)
  const pending = ctx.spy(referrals.createLink.statusesAtom).isPending

  const copyLink = () => {
    spawn(ctx, async (spawnCtx) => {
      try {
        const link = await referrals.createLink(spawnCtx)
        if (!link) return

        await navigator.clipboard.writeText(referralLinkUrl(link.token))
        toast.success(translate["home.referrals.copied"]())
      } catch {
        toast.error(translate["home.referrals.failed"]())
      }
    })
  }

  return (
    <Card>
      <CardTitle action={<Link href="/referrals" className={cardActionClass}>{translate["home.referrals.more"]()}</Link>}>
        {translate["home.referrals.title"]()}
      </CardTitle>
      <span className="text-2xl font-semibold">
        {stats ? `${stats.remaining} / ${stats.limit}` : "—"}
      </span>
      <span className="text-xs text-neutral-500">{translate["home.referrals.left"]()}</span>
      <Button
        background="default"
        className="h-8 w-fit text-xs font-semibold"
        disabled={pending || stats?.remaining === 0}
        onClick={copyLink}
      >
        {translate["home.referrals.copy"]()}
      </Button>
    </Card>
  )
}, "PlayerReferrals")

const PlayerLand = reatomComponent(({ ctx }) => {
  useUpdate((ctx) => { home.myLand(ctx) }, [])

  const land = ctx.spy(home.myLand.dataAtom)
  const pending = ctx.spy(home.myLand.statusesAtom).isPending

  if (pending) {
    return (
      <Card>
        <CardTitle action={<Link href="/lands" className={cardActionClass}>{translate["home.land.all"]()}</Link>}>
          {translate["home.land.title"]()}
        </CardTitle>
        <Skeleton className="h-10 w-full" />
      </Card>
    )
  }

  return (
    <Card>
      <CardTitle action={<Link href="/lands" className={cardActionClass}>{translate["home.land.all"]()}</Link>}>
        {translate["home.land.title"]()}
      </CardTitle>
      {land ? (
        <div className="flex flex-col gap-0.5">
          {land.title ? (
            <FormattedText text={land.title} className="truncate text-lg font-semibold" />
          ) : (
            <span className="truncate text-lg font-semibold">{land.name}</span>
          )}
          <span className="text-xs text-neutral-500">
            {translate["home.land.level"]({ level: land.level })}
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <span className="text-sm text-neutral-400">{translate["home.land.empty"]()}</span>
          <Link href="/lands" className="w-fit">
            <Button background="default" className="h-8 text-xs font-semibold">
              {translate["home.land.create"]()}
            </Button>
          </Link>
        </div>
      )}
    </Card>
  )
}, "PlayerLand")

export const PlayerPanel = reatomComponent(() => {
  return (
    <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <PlayerBalance />
      <PlayerTasks />
      <PlayerReferrals />
      <PlayerLand />
    </div>
  )
}, "PlayerPanel")

const GUEST_STEPS = [
  ["1", "home.steps.one_title", "home.steps.one_text"],
  ["2", "home.steps.two_title", "home.steps.two_text"],
  ["3", "home.steps.three_title", "home.steps.three_text"],
] as const

const GuestSteps = () => (
  <Card>
    <CardTitle>{translate["home.steps.title"]()}</CardTitle>
    <ol className="flex flex-col gap-2 text-sm">
      {GUEST_STEPS.map(([step, titleKey, textKey]) => (
        <li key={step} className="flex gap-2">
          <span className="flex size-6 shrink-0 items-center
            justify-center rounded-full bg-green-500/15 text-xs font-semibold text-green-300">
            {step}
          </span>
          <span className="flex flex-col">
            <span className="font-semibold text-neutral-100">{translate[titleKey]()}</span>
            <span className="text-xs text-neutral-400">{translate[textKey]()}</span>
          </span>
        </li>
      ))}
    </ol>
    <Link href="/auth?type=register" className={cardActionClass}>
      {translate["home.steps.action"]()}
    </Link>
  </Card>
)

const GuestTopPlayers = reatomComponent(({ ctx }) => {
  useUpdate((ctx) => { home.topPlayers(ctx) }, [])

  const players = ctx.spy(home.topPlayers.dataAtom)
  const pending = ctx.spy(home.topPlayers.statusesAtom).isPending

  if (pending && !players) {
    return (
      <Card>
        <CardTitle action={<Link href="/ratings" className={cardActionClass}>{translate["home.top.all"]()}</Link>}>
          {translate["home.top.title"]()}
        </CardTitle>
        <Skeleton className="h-24 w-full" />
      </Card>
    )
  }

  return (
    <Card>
      <CardTitle action={<Link href="/ratings" className={cardActionClass}>{translate["home.top.all"]()}</Link>}>
        {translate["home.top.title"]()}
      </CardTitle>
      {players?.length ? (
        <ul className="flex flex-col gap-1.5">
          {players.map((player, idx) => (
            <li key={player.nickname} className="flex items-center gap-2 text-sm">
              <span className="w-4 text-xs text-neutral-500">
                {idx + 1}
              </span>
              <Avatar url={player.avatar} nickname={player.nickname} className="size-5" />
              <span className="truncate">
                {player.nickname}
              </span>
              <span className="ms-auto shrink-0 text-xs text-neutral-500">
                {formatDuration(player.total)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <span className="text-sm text-neutral-500">
          {translate["home.top.empty"]()}
        </span>
      )}
    </Card>
  )
}, "GuestTopPlayers")

const GuestStore = reatomComponent(({ ctx }) => {
  useUpdate((ctx) => { home.storeItems(ctx) }, [])

  const items = ctx.spy(home.storeItems.dataAtom)

  return (
    <Card>
      <CardTitle action={<Link href="/store" className={cardActionClass}>{translate["home.store.all"]()}</Link>}>
        {translate["home.store.title"]()}
      </CardTitle>
      {items?.length ? (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link href={`/store/i/${item.id}`} className="flex items-center gap-2 text-sm hover:text-neutral-100">
                <img src={item.imageUrl} alt="" className="size-8 rounded object-cover" loading="lazy" />
                <span className="truncate">{item.title}</span>
                <span className="ms-auto flex shrink-0 items-center gap-1 text-xs text-green-300">
                  <img
                    src={item.currency === "CHARISM" ? charismImage : belkoinImage}
                    alt={item.currency}
                    className="size-3.5"
                  />
                  {formatNumber(item.price)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <span className="text-sm text-neutral-500">
          {translate["home.store.empty"]()}
        </span>
      )}
    </Card>
  )
}, "GuestStore")

const GuestFaq = reatomComponent(({ ctx }) => {
  useUpdate(homeFaq, [])

  const items = ctx.spy(homeFaq.dataAtom) ?? []
  if (items.length === 0) return null

  return (
    <Card>
      <CardTitle>{translate["home.faq.title"]()}</CardTitle>
      <div className="flex flex-col divide-y divide-neutral-800">
        {items.map((item) => (
          <details key={item.id} className="group py-2">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium">
              {item.question}
              <Icon name="sprite:chevron-down" className="size-4 shrink-0 text-neutral-500 group-open:rotate-180" />
            </summary>
            <p className="pt-1 text-xs text-neutral-400">{item.answer}</p>
            {item.linkHref && (
              <a
                href={item.linkHref}
                className="mt-1 inline-flex text-xs font-semibold text-green-400 underline underline-offset-4 hover:text-green-300"
              >
                {item.linkLabel ?? item.linkHref}
              </a>
            )}
          </details>
        ))}
      </div>
    </Card>
  )
}, "GuestFaq")

const GuestSeason = reatomComponent(({ ctx }) => {
  const news = ctx.spy(newsState.data)
  const latestNews = news[0]

  return (
    <Card>
      <CardTitle>{translate["home.season.title"]()}</CardTitle>
      <ul className="flex flex-col gap-2 text-sm">
        {latestNews && (
          <li className="flex flex-col">
            <Link
              href={createLink("news", latestNews.id)}
              className="truncate font-medium hover:text-neutral-100"
            >
              {latestNews.title}
            </Link>
            <span className="text-xs text-neutral-500">
              {translate["home.season.latest"]()}
            </span>
          </li>
        )}
      </ul>
      <Link href="/news" className={cardActionClass}>
        {translate["home.season.all"]()}
      </Link>
    </Card>
  )
}, "GuestSeason")

export const GuestPanel = reatomComponent(() => {
  return (
    <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <GuestSteps />
      <GuestTopPlayers />
      <GuestStore />
      <GuestSeason />
      <GuestFaq />
    </div>
  )
}, "GuestPanel")
