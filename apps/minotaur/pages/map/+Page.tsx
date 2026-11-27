import { useAtom } from "@reatom/npm-react"
import { createPageModel } from "@/shared/lib/events"
import { availableServers } from "@/shared/components/app/map/models/map.model"
import { getStaticImage } from "@/shared/lib/helpers"
import { PageHeaderImage } from "@/shared/ui/header-image"
import { Typography } from "@/shared/ui/typography"
import { ServersList, ServersToolbar } from "@/shared/components/app/map/components/servers-list"
import { translate } from "@/shared/locales/helpers"

const mapImage = getStaticImage("arts/6.jpg")

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
  const [_] = useAtom(page.dataAtom)

  return (
    <div className="flex flex-col w-full h-full gap-6">
      <PageHeaderImage img={mapImage} />
      <div className="flex flex-col gap-4 h-full w-full">
        <Typography className="text-3xl font-semibold">
          {translate["map.title"]()}
        </Typography>
        <ServersToolbar />
        <ServersList />
      </div>
    </div>
  )
}
