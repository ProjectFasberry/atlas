import { useAtom } from "@reatom/npm-react"
import { usePageContext } from "vike-react/usePageContext"
import { createPageModel } from "@/shared/lib/events"
import { availableServers } from "@/shared/components/app/map/models/map.model"
import { MapView } from "@/shared/components/app/map/components/map-view"

const page = createPageModel({
  name: "map-server",
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
  const { routeParams } = usePageContext()

  return <MapView server={String(routeParams.server ?? "")} />
}
