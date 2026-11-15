import { useEffect } from "react"
import { useAtom } from "@reatom/npm-react"
import { reatomComponent } from "@reatom/npm-react"
import { createPageModel } from "@/shared/lib/events"
import { currentUserState } from "@/shared/models/current-user/index.model"
import { HISTORY_READ_PERMISSION } from "@/shared/consts/permissions"
import { history } from "@/shared/components/app/private/models/history.model"
import { HistoryList } from "@/shared/components/app/private/components/history"
import { TeamApplications } from "@/shared/components/app/private/components/team"
import { PanelTabs } from "@/shared/components/app/private/components/panel-tabs"
import { PanelSection } from "@/shared/components/app/private/components/panel-section"
import { createTabAtom, hasTabAccess, type PanelTab } from "@/shared/components/app/private/models/tabs.model"

type ModerationTab = "team" | "audit"

const MODERATION_TABS: PanelTab<ModerationTab>[] = [
  { value: "team", title: "Заявки", permissions: ["team.applications.read"] },
  { value: "audit", title: "Аудит", permissions: ["history.read"] },
]

const moderationTab = createTabAtom("moderationTab", MODERATION_TABS, "team")

const page = createPageModel({
  name: "private.moderation",
  hooks: {
    onConnect: (ctx) => {
      const permissions = ctx.get(currentUserState.perms) ?? []
      if (!permissions.includes(HISTORY_READ_PERMISSION)) return

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

const ModerationSection = reatomComponent(({ ctx }) => {
  const tab = ctx.spy(moderationTab)
  const permissions = ctx.spy(currentUserState.perms) ?? []
  const allowed = MODERATION_TABS.filter((item) => hasTabAccess(item, permissions))
  const active = allowed.some((item) => item.value === tab) ? tab : allowed[0]?.value

  useEffect(() => {
    if (active && active !== tab) moderationTab(ctx, active)
  }, [active, tab, ctx])

  if (!active) return null

  return active === "team"
    ? (
      <PanelSection title="Заявки в команду">
        <TeamApplications />
      </PanelSection>
    )
    : (
      <PanelSection title="История">
        <HistoryList />
      </PanelSection>
    )
}, "ModerationSection")

const ModerationTabs = reatomComponent(({ ctx }) => {
  const tab = ctx.spy(moderationTab)

  return (
    <PanelTabs
      tabs={MODERATION_TABS}
      value={tab}
      onChange={(value) => moderationTab(ctx, value)}
    />
  )
}, "ModerationTabs")

export default function Page() {
  const [_] = useAtom(page.dataAtom)

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      <ModerationTabs />
      <ModerationSection />
    </div>
  )
}
