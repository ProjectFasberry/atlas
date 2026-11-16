import { useEffect } from "react"
import { reatomComponent } from "@reatom/npm-react"
import { currentUserState } from "@/shared/models/current-user/index.model"
import { PanelTabs } from "@/shared/components/app/private/components/panel-tabs"
import { PanelSection } from "@/shared/components/app/private/components/panel-section"
import { SectionWrapper } from "@/shared/components/app/private/components/ui"
import { PlayersMetrics } from "@/shared/components/app/private/components/players-metrics"
import { BuildMetrics } from "@/shared/components/app/private/components/build-metrics"
import { createTabAtom, hasTabAccess, type PanelTab } from "@/shared/components/app/private/models/tabs.model"
import { Icon } from "@/shared/ui/icon"
import { Typography } from "@/shared/ui/typography"
import { translate } from "@/shared/locales/helpers"

type AnalyticsTab = "players" | "builds"

const ANALYTICS_TABS: PanelTab<AnalyticsTab>[] = [
  { value: "players", title: translate["panel.players"]() },
  { value: "builds", title: translate["panel.infrastructure"]() },
]

const analyticsTab = createTabAtom("analyticsTab", ANALYTICS_TABS, "players")

const EXTERNAL_SERVICES = [
  { title: "Umami", description: translate["panel.web-analytics"](), href: "https://umami.fasberry.fun" },
  { title: "Portainer", description: translate["panel.containers"](), href: "https://portainer.fasberry.fun" },
  { title: "Gotify", description: translate["panel.alerts"](), href: "https://gotify.fasberry.fun" },
]

const ExternalServices = () => (
  <PanelSection title={translate["panel.external-services"]()}>
    <div className="grid gap-2 sm:grid-cols-3">
      {EXTERNAL_SERVICES.map((service) => (
        <a
          key={service.title}
          href={service.href}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between gap-2 rounded-xl border border-neutral-800 px-3 py-2 duration-150 hover:bg-neutral-800/60"
        >
          <div className="flex flex-col">
            <Typography className="text-sm font-semibold">{service.title}</Typography>
            <Typography color="gray" className="text-xs">{service.description}</Typography>
          </div>
          <Icon name="sprite:external-link" className="size-4 text-neutral-500" />
        </a>
      ))}
    </div>
  </PanelSection>
)

const AnalyticsSection = reatomComponent(({ ctx }) => {
  const tab = ctx.spy(analyticsTab)
  const permissions = ctx.spy(currentUserState.perms) ?? []
  const allowed = ANALYTICS_TABS.filter((item) => hasTabAccess(item, permissions))
  const active = allowed.some((item) => item.value === tab) ? tab : allowed[0]?.value

  useEffect(() => {
    if (active && active !== tab) analyticsTab(ctx, active)
  }, [active, tab, ctx])

  if (!active) return null

  return (
    <SectionWrapper className="flex flex-col gap-3 w-full">
      {active === "players" ? <PlayersMetrics /> : <BuildMetrics />}
    </SectionWrapper>
  )
}, "AnalyticsSection")

const AnalyticsTabs = reatomComponent(({ ctx }) => {
  const tab = ctx.spy(analyticsTab)

  return (
    <PanelTabs
      tabs={ANALYTICS_TABS}
      value={tab}
      onChange={(value) => analyticsTab(ctx, value)}
    />
  )
}, "AnalyticsTabs")

export default function Page() {
  return (
    <div className="flex flex-col gap-4 w-full h-full">
      <AnalyticsTabs />
      <AnalyticsSection />
      <ExternalServices />
    </div>
  )
}
