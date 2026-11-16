import { translate } from "@/shared/locales/helpers"
import { reatomComponent } from "@reatom/npm-react"
import { serverStatus } from "../../intro/models/intro.model"
import { Toolbar, ToolbarActions, ToolbarSelect } from "@/shared/ui/toolbar"
import { Skeleton } from "@/shared/ui/skeleton"
import { availableServers, mapSortAtom, type AvailableServer } from "../models/map.model"
import { ErrorBlock } from "@/shared/ui/error-block"
import { Typography } from "@/shared/ui/typography"
import { Icon } from "@/shared/ui/icon"
import { Avatar } from "@/shared/ui/avatar"
import { pageState } from "@/shared/models/page-context.model"

const serversListClassname = "grid grid-cols-1 gap-3 sm:grid-cols-2"

type StatusServers = NonNullable<ExtractApiData<"getServerStatus">["data"]>["servers"]
type ServerMeta = StatusServers[string] | undefined

const ServerCard = ({
  name, value, href, img, meta
}: AvailableServer & { meta: ServerMeta }) => {
  const players = meta?.players ?? []
  const preview = meta?.thumbnail || img
  const isOnline = Boolean(meta?.available)

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl bg-neutral-900">
      <div className="relative h-32 w-full overflow-hidden sm:h-36">
        {preview ? (
          <img
            src={preview}
            alt=""
            loading="lazy"
            className="h-full w-full select-none object-cover duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-neutral-800">
            <Icon name="sprite:map" className="size-8 text-neutral-600" />
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
        <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-md bg-black/60
          px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-200">
          <span className={`size-2 rounded-full ${isOnline ? "bg-green-400" : "bg-neutral-500"}`} />
          {isOnline ? translate["map.online"]() : translate["map.offline"]()}
        </span>
        {isOnline && (
          <span className="absolute right-3 top-3 rounded-md bg-black/60 px-2 py-0.5
            text-[11px] font-semibold tabular-nums text-neutral-200">
            {meta?.online ?? 0}/{meta?.max ?? 0}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-col gap-1">
          <Typography className="text-lg font-semibold">{name}</Typography>
          <Typography color="gray" className="line-clamp-2 text-xs">
            {meta?.description || translate["map.description"]()}
          </Typography>
        </div>
        {players.length && (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {players.slice(0, 3).map((nickname) => (
                <Avatar
                  key={nickname}
                  url=""
                  nickname={nickname}
                  className="size-6 ring-2 ring-neutral-900"
                />
              ))}
            </div>
            <span className="text-xs text-neutral-400">
              {translate["map.players"]({ count: players.length })}
            </span>
          </div>
        )}
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="mt-auto flex h-9 w-fit items-center gap-2 rounded-xl bg-neutral-50
          px-4 py-1 text-neutral-950 duration-150 hover:bg-white"
        >
          <Typography className="text-sm font-semibold leading-6">
            {translate["map.goTo"]()}
          </Typography>
          <Icon name="sprite:external-link" className="size-4" />
        </a>
      </div>
    </article>
  )
}

const ServerCardSkeleton = () => (
  <div className="flex flex-col overflow-hidden rounded-xl bg-neutral-900">
    <Skeleton className="h-32 w-full rounded-none sm:h-36" />
    <div className="flex flex-col gap-3 p-4">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-9 w-36" />
    </div>
  </div>
)

const ServersListSkeleton = () => (
  <div className={serversListClassname}>
    <ServerCardSkeleton />
    <ServerCardSkeleton />
  </div>
)
const ServersListError = () => (
  <div className="flex flex-col items-center gap-2 py-16 text-center">
    <Icon name="sprite:map" className="size-8 text-neutral-600" />
    <Typography color="gray" className="text-sm">
      {translate["map.empty"]()}
    </Typography>
  </div>
)

export const ServersList = reatomComponent(({ ctx }) => {
  const statuses = ctx.spy(availableServers.fetch.statusesAtom)
  const error = ctx.spy(availableServers.fetch.errorAtom)

  if (statuses.isPending) return <ServersListSkeleton />
  if (error) return <ErrorBlock title={error.message} />

  const data = ctx.spy(availableServers.fetch.dataAtom)
  if (!data || data.length === 0) return <ServersListError />

  const status = ctx.spy(serverStatus.fetch.dataAtom)
  const metaOf = (server: AvailableServer) => status?.servers[server.value]

  const sort = ctx.spy(mapSortAtom)

  const servers = [...data].sort((left, right) => {
    if (sort === "name") return left.name.localeCompare(right.name, "ru")
    return (metaOf(right)?.online ?? -1) - (metaOf(left)?.online ?? -1)
  })

  return (
    <div className={serversListClassname}>
      {servers.map((server) => (
        <ServerCard key={server.value} {...server} meta={metaOf(server)} />
      ))}
    </div>
  )
}, "ServersList")

const sortItems = [
  { label: translate["map.sort.online"](), value: "online" },
  { label: translate["map.sort.name"](), value: "name" },
]

export const ServersToolbar = reatomComponent(({ ctx }) => {
  const status = ctx.spy(serverStatus.fetch.dataAtom)
  const sort = ctx.spy(mapSortAtom)
  const online = status?.proxy.online ?? 0

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
        <ToolbarSelect
          label={translate["map.sort.label"]()}
          items={sortItems}
          value={[sort]}
          onValueChange={(value) => mapSortAtom(ctx, value as typeof sort)}
        />
      </ToolbarActions>
    </Toolbar>
  )
}, "ServersToolbar")
