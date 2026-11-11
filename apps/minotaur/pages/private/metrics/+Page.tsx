import { useAtom } from "@reatom/npm-react"
import { BuildMetrics } from "@/shared/components/app/private/components/build-metrics"
import { PlayersMetrics } from "@/shared/components/app/private/components/players-metrics"
import { SectionWrapper, WithHeader } from "@/shared/components/app/private/components/ui"
import { metricsTab, type MetricsTab } from "@/shared/components/app/private/models/metrics-tab.model"
import { Button } from "@/shared/ui/button"
import { clsx } from "cnfast"

const TABS: { value: MetricsTab, label: string }[] = [
  { value: "players", label: "Игроки" },
  { value: "builds", label: "Сборки" },
]

export default function Page() {
  const [tab, setTab] = useAtom(metricsTab)

  return (
    <SectionWrapper className="flex flex-col gap-3 w-full h-full">
      <WithHeader title="Метрики">
        <div className="flex items-center gap-1">
          {TABS.map((option) => (
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
      {tab === "players" ? <PlayersMetrics /> : <BuildMetrics />}
    </SectionWrapper>
  )
}
