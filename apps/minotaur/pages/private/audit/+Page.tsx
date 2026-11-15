import { useAtom } from "@reatom/npm-react"
import { createPageModel } from "@/shared/lib/events"
import { history } from "@/shared/components/app/private/models/history.model"
import { HistoryList } from "@/shared/components/app/private/components/history"
import { AUDIT_TABS, auditTab } from "@/shared/components/app/private/models/audit.model"
import { SectionWrapper, WithHeader } from "@/shared/components/app/private/components/ui"
import { Button } from "@/shared/ui/button"
import { clsx } from "cnfast"

const page = createPageModel({
  name: "private.audit",
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
  const [tab, setTab] = useAtom(auditTab)

  return (
    <SectionWrapper className="flex flex-col gap-3 w-full h-full">
      <WithHeader title="Аудит">
        <div className="flex items-center gap-1">
          {AUDIT_TABS.map((option) => (
            <Button
              key={option.value}
              background="default"
              className={clsx(
                "h-7 rounded-lg px-3 text-xs",
                tab === option.value ? "bg-neutral-50! text-neutral-950!" : "bg-neutral-800",
              )}
              onClick={() => setTab(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </WithHeader>
      {tab === "history" && <HistoryList />}
    </SectionWrapper>
  )
}
