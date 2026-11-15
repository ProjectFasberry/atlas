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
import { createTabAtom, hasTabAccess, type PanelTab } from "@/shared/components/app/private/models/tabs.model"
import { type ActionParent } from "@/shared/components/app/private/models/actions.model"

type ContentTab = Extract<ActionParent, "news" | "banner" | "event" | "modpack" | "lands">

const CONTENT_TABS: PanelTab<ContentTab>[] = [
  { value: "news", title: "Новости", permissions: ["news.create", "news.update", "news.delete"] },
  { value: "banner", title: "Баннеры", permissions: ["banners.create", "banners.delete"] },
  { value: "event", title: "Ивенты", permissions: ["events.create", "events.delete"] },
  { value: "modpack", title: "Модпаки", permissions: ["modpacks.create", "modpacks.delete"] },
  { value: "lands", title: "Регионы", permissions: ["lands.read"] },
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
        return { title: "Новости", wrapper: <newsSection.Wrapper /> }
      case "banner":
        return { title: "Баннеры", wrapper: <bannersSection.Wrapper /> }
      case "event":
        return { title: "Ивенты", wrapper: <eventsSection.Wrapper /> }
      case "modpack":
        return { title: "Модпаки", wrapper: <modpackSection.Wrapper /> }
      case "lands":
        return { title: "Регионы", wrapper: <landsSection.Wrapper /> }
    }
  })()

  return (
    <PanelSection
      title={section.title}
      parent={active}
      action={<ActionsHeaderSlot parent={active} />}
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
