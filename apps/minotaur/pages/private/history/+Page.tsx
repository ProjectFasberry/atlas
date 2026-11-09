import { useAtom } from "@reatom/npm-react"
import { createPageModel } from "@/shared/lib/events"
import { history } from "@/shared/components/app/private/models/history.model"
import { HistoryList } from "@/shared/components/app/private/components/history"

const page = createPageModel({
  name: "private.history",
  hooks: {
    onConnect: (ctx) => {
      history.connect(ctx);
      history.fetch(ctx);
    },
    onDisconnect: (ctx) => {
      history.disconnect(ctx);
      history.fetch.abort(ctx);
      history.loadMore.abort(ctx);
    }
  }
})

export default function Page() {
  const [_] = useAtom(page.dataAtom)

  return <HistoryList />
}
