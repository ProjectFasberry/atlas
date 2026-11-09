import { createPageModel } from "@/shared/lib/events"
import { availableServers, type AvailableServer } from "@/shared/components/app/map/models/map.model"
import { getStaticImage } from "@/shared/lib/helpers"
import { translate } from "@/shared/locales/helpers"
import { PageHeaderImage } from "@/shared/ui/header-image"
import { reatomComponent, useAtom } from "@reatom/npm-react"
import { Skeleton } from "@/shared/ui/skeleton"
import { Typography } from "@/shared/ui/typography"
import { Icon } from "@/shared/ui/icon"
import { ErrorBlock } from "@/shared/ui/error-block"

const mapImage = getStaticImage("arts/6.jpg")

const serversListClassname = "grid grid-cols-1 sm:grid-cols-2 auto-rows-auto gap-2 w-full"
const serversListItemClassname = `
  flex sm:flex-col flex-row items-center justify-between sm:items-stretch sm:justify-center
  px-4 gap-4 w-full bg-neutral-900 h-22 sm:h-26 rounded-xl
`;

const ServersListItem = ({ name, href }: AvailableServer) => {
  return (
    <div className={serversListItemClassname}>
      <Typography className='font-semibold'>
        {name}
      </Typography>
      <a
        href={href}
        target="_blank"
        className="flex items-center gap-2 min-w-0 rounded-xl px-4 py-1 w-fit bg-neutral-50 text-neutral-950"
      >
        <Typography className='font-semibold truncate min-w-0 leading-6'>
          {translate["map.goTo"]()}
        </Typography>
        <Icon name="sprite:external-link" className="size-4" />
      </a>
    </div>
  )
}

const ServersListSkeleton = () => (
  <div className={serversListClassname}>
    <Skeleton className={serversListItemClassname} />
    <Skeleton className={serversListItemClassname} />
  </div>
);

const ServersList = reatomComponent(({ ctx }) => {
  if (ctx.spy(availableServers.fetch.statusesAtom).isPending) return <ServersListSkeleton />;

  const error = ctx.spy(availableServers.fetch.errorAtom)
  if (error) return <ErrorBlock title={error.message} />

  const data = ctx.spy(availableServers.fetch.dataAtom);
  if (!data) return null;

  return (
    <div className={serversListClassname}>
      {data.map((server, idx) => <ServersListItem key={idx} {...server} />)}
    </div>
  )
}, 'ServersList')

const page = createPageModel({
  name: "map",
  hooks: {
    onConnect: (ctx) => {
      availableServers.fetch(ctx)
    },
    onDisconnect: (ctx) => {
      availableServers.fetch.abort(ctx)
    }
  }
})

export default function Page() {
  const [_] = useAtom(page.dataAtom);

  return (
    <div className="flex flex-col w-full h-full gap-6">
      <PageHeaderImage img={mapImage} />
      <div className="flex flex-col gap-4 h-full w-full">
        <Typography className="text-3xl font-semibold">
          {translate["map.title"]()}
        </Typography>
        <ServersList />
      </div>
    </div>
  )
}
