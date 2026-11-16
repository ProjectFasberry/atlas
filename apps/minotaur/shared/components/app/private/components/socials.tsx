import { reatomComponent, useUpdate } from "@reatom/npm-react"
import { Typography } from "@/shared/ui/typography"
import { Switch } from "@/shared/ui/switch"
import { Skeleton } from "@/shared/ui/skeleton"
import { Icon, type IconName } from "@/shared/ui/icon"
import { Button } from "@/shared/ui/button"
import { ErrorBlock } from "@/shared/ui/error-block"
import { Noop } from "@/shared/ui/noop"
import { SOCIALS_ICONS } from "@/shared/consts/icons"
import { translate } from "@/shared/locales/helpers"
import { getSocialIsUpdating, socials, type SocialPayload } from "../models/socials.model"

const socialIcon = (value: string): IconName => SOCIALS_ICONS[value] ?? "sprite:language"

const SocialItem = reatomComponent<SocialPayload>(({ ctx, value, title, isAvailable }) => {
  const isLoading = ctx.spy(getSocialIsUpdating(value))

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-neutral-800
      px-3 py-2.5 duration-150 hover:border-neutral-700">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-neutral-800">
          <Icon name={socialIcon(value)} className="size-5 text-neutral-300" />
        </span>
        <div className="flex min-w-0 flex-col">
          <Typography className="truncate text-sm font-semibold">{title}</Typography>
          <Typography color="gray" className="truncate text-xs">{value}</Typography>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-[11px] font-semibold text-neutral-400">
          {isAvailable ? translate["panel.on"]() : translate["panel.off"]()}
        </span>
        <Switch
          checked={isAvailable}
          isLoading={isLoading}
          disabled={isLoading}
          onCheckedChange={({ checked }) => socials.update(ctx, value, checked)}
        />
      </div>
    </div>
  )
}, "SocialItem")

const SocialsListSkeleton = () => Array.from({ length: 2 }).map((_, idx) => (
  <Skeleton key={idx} className="h-14 w-full" />
))

const SocialsList = reatomComponent(({ ctx }) => {
  useUpdate(socials.fetch, [])

  if (ctx.spy(socials.fetch.statusesAtom).isFirstPending) return <SocialsListSkeleton />

  const error = ctx.spy(socials.fetch.errorAtom)
  if (error) {
    return (
      <div className="flex flex-col items-start gap-2">
        <ErrorBlock title={error.message} />
        <Button background="default" className="h-8 text-sm" onClick={() => socials.fetch(ctx)}>
          {translate["panel.retry"]()}
        </Button>
      </div>
    )
  }

  const data = ctx.spy(socials.fetch.dataAtom)
  if (!data.length) return <Noop title={translate["panel.socials-empty"]()} />

  return data.map((social) => <SocialItem key={social.value} {...social} />)
}, "SocialsList")

export const SocialsPanel = () => {
  return (
    <div className="flex w-full flex-col gap-3">
      <Typography color="gray" className="text-sm">
        {translate["panel.socials-description"]()}
      </Typography>
      <div className="flex w-full flex-col gap-2">
        <SocialsList />
      </div>
    </div>
  )
}
