import { useAtom } from "@reatom/npm-react"
import { createPageModel } from "@/shared/lib/events"
import { availableServers } from "@/shared/components/app/map/models/map.model"
import { MapFrame, ServersToolbar } from "@/shared/components/app/map/components/servers-list"

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
    <div className="flex h-[calc(100dvh-11rem)] min-h-[460px] w-full flex-col gap-3">
      <ServersToolbar />
      <MapFrame />
    </div>
  )
}
