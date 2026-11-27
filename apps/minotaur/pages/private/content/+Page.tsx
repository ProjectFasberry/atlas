import { useEffect } from "react"
import { reatomComponent } from "@reatom/npm-react"
import { currentUserState } from "@/shared/models/current-user/index.model"
import { PanelTabs } from "@/shared/components/app/private/components/panel-tabs"
import { PanelSection } from "@/shared/components/app/private/components/panel-section"
import { ActionsHeaderSlot } from "@/shared/components/app/private/components/actions-header"
import { newsSection } from "@/shared/components/app/private/components/news"
import { bannersSection } from "@/shared/components/app/private/components/banners"
import { eventsSection } from "@/shared/components/app/private/components/events"
import { modpackSection } from "@/shared/components/app/private/components/modpack"
import { landsSection } from "@/shared/components/app/private/components/lands"
import { tasksSection } from "@/shared/components/app/private/components/tasks"
import { RulesPanel } from "@/shared/components/app/private/components/rules"
import { FaqPanel } from "@/shared/components/app/private/components/faq"
import { createTabAtom, hasTabAccess, type PanelTab } from "@/shared/components/app/private/models/tabs.model"
import { type ActionParent } from "@/shared/components/app/private/models/actions.model"
import { RULES_READ_PERMISSION } from "@/shared/consts/permissions"
import { translate } from "@/shared/locales/helpers"

type ContentTab = Extract<ActionParent, "news" | "banner" | "event" | "modpack" | "lands" | "task"> | "rules" | "faq"

const CONTENT_TABS: PanelTab<ContentTab>[] = [
  { value: "news", title: translate["panel.news"](), permissions: ["news.create", "news.update", "news.delete"] },
  { value: "banner", title: translate["panel.banners"](), permissions: ["banners.create", "banners.delete"] },
  { value: "event", title: translate["panel.events"](), permissions: ["events.create", "events.delete"] },
  { value: "modpack", title: translate["panel.modpacks"](), permissions: ["modpacks.create", "modpacks.delete"] },
  { value: "lands", title: translate["panel.lands"](), permissions: ["lands.read"] },
  { value: "task", title: translate["panel.tasks"](), permissions: ["tasks.create", "tasks.update", "tasks.delete"] },
  { value: "rules", title: translate["panel.rules"](), permissions: [RULES_READ_PERMISSION] },
  { value: "faq", title: translate["panel.faq"](), permissions: ["content.read"] },
]

const contentTab = createTabAtom("contentTab", CONTENT_TABS, "news")

const ContentSection = reatomComponent(({ ctx }) => {
  const tab = ctx.spy(contentTab)
  const permissions = ctx.spy(currentUserState.perms) ?? []
  const allowed = CONTENT_TABS.filter((item) => hasTabAccess(item, permissions))
  const active = allowed.some((item) => item.value === tab) ? tab : allowed[0]?.value

  useEffect(() => {
    if (active && active !== tab) contentTab(ctx, active)
  }, [active, tab, ctx])

  if (!active) return null

  const section = (() => {
    switch (active) {
      case "news":
        return { title: translate["panel.news"](), wrapper: <newsSection.Wrapper /> }
      case "banner":
        return { title: translate["panel.banners"](), wrapper: <bannersSection.Wrapper /> }
      case "event":
        return { title: translate["panel.events"](), wrapper: <eventsSection.Wrapper /> }
      case "modpack":
        return { title: translate["panel.modpacks"](), wrapper: <modpackSection.Wrapper /> }
      case "lands":
        return { title: translate["panel.lands"](), wrapper: <landsSection.Wrapper /> }
      case "task":
        return { title: translate["panel.tasks"](), wrapper: <tasksSection.Wrapper /> }
      case "rules":
        return { title: translate["panel.rules"](), wrapper: <RulesPanel /> }
      case "faq":
        return { title: translate["panel.faq"](), wrapper: <FaqPanel /> }
    }
  })()

  return (
    <PanelSection
      title={section.title}
      parent={active === "rules" || active === "faq" ? undefined : active as ActionParent}
      action={active === "rules" || active === "faq" ? undefined : <ActionsHeaderSlot parent={active as ActionParent} />}
    >
      {section.wrapper}
    </PanelSection>
  )
}, "ContentSection")

export default function Page() {
  return (
    <div className="flex flex-col gap-4 w-full h-full">
      <ContentTabs />
      <ContentSection />
    </div>
  )
}

const ContentTabs = reatomComponent(({ ctx }) => {
  const tab = ctx.spy(contentTab)

  return (
    <PanelTabs
      tabs={CONTENT_TABS}
      value={tab}
      onChange={(value) => contentTab(ctx, value)}
    />
  )
}, "ContentTabs")
