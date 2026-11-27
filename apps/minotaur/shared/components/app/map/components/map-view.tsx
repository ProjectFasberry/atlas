import { reatomComponent } from "@reatom/npm-react"
import { availableServers } from "../models/map.model"
import { ErrorBlock } from "@/shared/ui/error-block"
import { Skeleton } from "@/shared/ui/skeleton"
import { Typography } from "@/shared/ui/typography"
import { Icon } from "@/shared/ui/icon"
import { Link } from "@/shared/components/config/link/link"
import { pageState } from "@/shared/models/page-context.model"
import { translate } from "@/shared/locales/helpers"
import { getLocale } from "@/paraglide/runtime"

const frameClassName = "relative min-h-[420px] w-full flex-1 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900"

const MapViewSkeleton = () => (
  <div className="flex min-h-[460px] w-full flex-1 flex-col gap-3">
    <Skeleton className="h-5 w-40" />
    <div className={frameClassName}>
      <Skeleton className="absolute inset-0 rounded-none" />
    </div>
  </div>
)

const MapViewMessage = ({ title }: { title: string }) => (
  <div className="flex flex-col gap-3">
    <MapBackLink />
    <div className={`${frameClassName} flex flex-col items-center justify-center gap-2 text-center`}>
      <Icon name="sprite:map" className="size-8 text-neutral-600" />
      <Typography color="gray" className="text-sm">
        {title}
      </Typography>
    </div>
  </div>
)

const MapBackLink = () => (
  <Link
    href="/map"
    className="flex w-fit items-center gap-1.5 text-sm font-medium text-neutral-400
    duration-150 hover:text-neutral-100"
  >
    <Icon name="sprite:arrow-left" className="size-4" />
    {translate["map.back"]()}
  </Link>
)

export const MapView = reatomComponent<{ server: string }>(({ ctx, server: value }) => {
  const statuses = ctx.spy(availableServers.fetch.statusesAtom)
  const error = ctx.spy(availableServers.fetch.errorAtom)
  const data = ctx.spy(availableServers.fetch.dataAtom)
  const isClientside = ctx.spy(pageState.isClientside)

  if (statuses.isPending) return <MapViewSkeleton />
  if (error) return <ErrorBlock title={error.message} />

  const server = data?.find((item) => item.value === value)
  if (!server) return <MapViewMessage title={translate["map.notFound"]()} />
  if (!server.href) return <MapViewMessage title={translate["map.soon"]()} />

  // Keep the embedded UI in the site language instead of the map default.
  const src = (() => {
    try {
      const url = new URL(server.href, window.location.origin)
      url.searchParams.set("lang", getLocale())
      return url.toString()
    } catch {
      return server.href
    }
  })()

  return (
    <div className="flex h-[calc(100dvh-11rem)] min-h-[460px] w-full flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <MapBackLink />
          <Typography className="text-sm font-semibold">{server.name}</Typography>
        </div>
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className="flex h-9 items-center gap-2 rounded-xl bg-neutral-900 px-3 text-sm
          font-medium text-neutral-300 duration-150 hover:text-neutral-100"
        >
          <span className="hidden sm:inline">{translate["map.openNewTab"]()}</span>
          <Icon name="sprite:external-link" className="size-4" />
        </a>
      </div>
      <div className={frameClassName}>
        {!isClientside ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Icon name="sprite:map" className="size-8 text-neutral-600" />
            <Typography color="gray" className="text-sm">
              {translate["map.loading"]()}
            </Typography>
          </div>
        ) : (
          <iframe
            src={src}
            title={translate["map.frameTitle"]({ server: server.name })}
            className="absolute inset-0 size-full border-0"
            allow="fullscreen"
          />
        )}
      </div>
    </div>
  )
}, "MapView")
