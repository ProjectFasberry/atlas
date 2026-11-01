import { useAtom } from "@reatom/npm-react"
import { createPageModel } from "@/shared/lib/events"
import { createEs } from "@/shared/lib/helpers"
import { history, historyState } from "@/shared/components/app/private/models/history.model"
import { HistoryList } from "@/shared/components/app/private/components/history"

const page = createPageModel({
  name: "private.history",
  hooks: {
    onConnect: (ctx) => {
      history.fetch(ctx);

      const es = createEs("privated/history/events", { withCredentials: true })
      const current = ctx.get(historyState.es)

      if (current) {
        current.close()
        historyState.es(ctx, es)
        return
      }

      historyState.es(ctx, es)
    },
    onDisconnect: (ctx) => {
      const source = ctx.get(historyState.es);
      if (!source) return;

      source.close()
      historyState.es.reset(ctx)
    }
  }
})

export default function Page() {
  const [_] = useAtom(page.dataAtom)

  return <HistoryList />
}
