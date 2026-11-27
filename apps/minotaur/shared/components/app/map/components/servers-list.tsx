import { reatomComponent } from "@reatom/npm-react"
import { availableServers, mapServerAtom } from "../models/map.model"
import { serverStatus } from "../../intro/models/intro.model"
import { Toolbar, ToolbarActions, ToolbarSelect } from "@/shared/ui/toolbar"
import { Skeleton } from "@/shared/ui/skeleton"
import { ErrorBlock } from "@/shared/ui/error-block"
import { Typography } from "@/shared/ui/typography"
import { Icon } from "@/shared/ui/icon"
import { pageState } from "@/shared/models/page-context.model"
import { translate } from "@/shared/locales/helpers"
import { getLocale } from "@/paraglide/runtime"

const frameClassName = "relative min-h-[420px] w-full flex-1 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900"

const MapFrameSkeleton = () => (
  <div className={frameClassName}>
    <Skeleton className="absolute inset-0 rounded-none" />
  </div>
)

const MapFrameEmpty = () => (
  <div className={`${frameClassName} flex flex-col items-center justify-center gap-2 text-center`}>
    <Icon name="sprite:map" className="size-8 text-neutral-600" />
    <Typography color="gray" className="text-sm">
      {translate["map.empty"]()}
    </Typography>
  </div>
)

export const MapFrame = reatomComponent(({ ctx }) => {
  const statuses = ctx.spy(availableServers.fetch.statusesAtom)
  const error = ctx.spy(availableServers.fetch.errorAtom)
  const data = ctx.spy(availableServers.fetch.dataAtom)
  const selected = ctx.spy(mapServerAtom)
  const isClientside = ctx.spy(pageState.isClientside)

  if (statuses.isPending) return <MapFrameSkeleton />
  if (error) return <ErrorBlock title={error.message} />
  if (!data || data.length === 0) return <MapFrameEmpty />

  const server = data.find((item) => item.value === selected) ?? data[0]
  if (!server) return <MapFrameEmpty />

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
  )
}, "MapFrame")

export const ServersToolbar = reatomComponent(({ ctx }) => {
  const status = ctx.spy(serverStatus.fetch.dataAtom)
  const data = ctx.spy(availableServers.fetch.dataAtom)
  const selected = ctx.spy(mapServerAtom)
  const online = status?.proxy.online ?? 0

  const server = data?.find((item) => item.value === selected) ?? data?.[0]
  const serverItems = (data ?? []).map((item) => ({ label: item.name, value: item.value }))

  return (
    <Toolbar>
      <div className="flex items-center gap-2 text-sm text-neutral-400">
        {!ctx.spy(pageState.isClientside) ? (
          <Skeleton className="h-4 w-40" />
        ) : (
          <>
            <span
              className={`size-2 rounded-full ${online > 0 ? "bg-green-400" : "bg-neutral-500"}`}
            />
            <span>
              {translate["map.summary"]({ count: online })}
            </span>
          </>
        )}
      </div>
      <ToolbarActions>
        {serverItems.length > 1 && (
          <ToolbarSelect
            label={translate["map.server.label"]()}
            items={serverItems}
            value={server ? [server.value] : []}
            onValueChange={(value) => mapServerAtom(ctx, value)}
          />
        )}
        {server && (
          <a
            href={server.href}
            target="_blank"
            rel="noreferrer"
            className="flex h-10 items-center gap-2 rounded-xl bg-neutral-900 px-3 text-sm
            font-medium text-neutral-300 duration-150 hover:text-neutral-100"
          >
            <span className="hidden sm:inline">{translate["map.openNewTab"]()}</span>
            <Icon name="sprite:external-link" className="size-4" />
          </a>
        )}
      </ToolbarActions>
    </Toolbar>
  )
}, "ServersToolbar")
