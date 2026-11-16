import { useEffect } from "react"
import { reatomComponent } from "@reatom/npm-react"
import { currentUserState } from "@/shared/models/current-user/index.model"
import { WithHeader } from "./ui"
import { PanelTabs } from "./panel-tabs"
import { PanelSection } from "./panel-section"
import { ActionsHeaderSlot } from "./actions-header"
import { Options } from "./options"
import { Methods } from "./methods"
import { Roles } from "./roles"
import { dictionariesSection } from "./dictionaries"
import { Servers } from "./servers"
import { createTabAtom, hasTabAccess, type PanelTab } from "../models/tabs.model"
import { translate } from "@/shared/locales/helpers"

type ConfigTab = "general" | "roles" | "dictionaries" | "servers"

const CONFIG_TABS: PanelTab<ConfigTab>[] = [
  { value: "general", title: translate["panel.main"]() },
  { value: "roles", title: translate["panel.roles"](), permissions: ["roles.read"] },
  { value: "dictionaries", title: translate["panel.dictionary"](), permissions: ["dictionaries.read"] },
  { value: "servers", title: translate["panel.servers"](), permissions: ["servers.read"] },
]

const configTab = createTabAtom("configTab", CONFIG_TABS, "general")

export const Config = reatomComponent(({ ctx }) => {
  const tab = ctx.spy(configTab)
  const permissions = ctx.spy(currentUserState.perms) ?? []
  const allowed = CONFIG_TABS.filter((item) => hasTabAccess(item, permissions))
  const active = allowed.some((item) => item.value === tab) ? tab : allowed[0]?.value

  useEffect(() => {
    if (active && active !== tab) configTab(ctx, active)
  }, [active, tab, ctx])

  if (!active) return null

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      <PanelTabs
        tabs={CONFIG_TABS}
        value={active}
        onChange={(value) => configTab(ctx, value)}
      />

      {active === "general" && (
        <PanelSection title={translate["panel.main"]()}>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-stretch w-full">
            <div className="flex flex-col gap-1 w-full">
              <WithHeader title={translate["panel.global-settings"]()} />
              <Options />
            </div>
            <div className="flex flex-col gap-1 w-full">
              <WithHeader title={translate["panel.payment-methods"]()} />
              <Methods />
            </div>
          </div>
        </PanelSection>
      )}

      {active === "roles" && (
        <PanelSection title={translate["panel.roles"]()}>
          <Roles />
        </PanelSection>
      )}

      {active === "dictionaries" && (
        <PanelSection
          title={translate["panel.dictionary"]()}
          parent="dictionaries"
          action={<ActionsHeaderSlot parent="dictionaries" />}
        >
          <dictionariesSection.Wrapper />
        </PanelSection>
      )}

      {active === "servers" && (
        <PanelSection title={translate["panel.servers"]()}>
          <Servers />
        </PanelSection>
      )}
    </div>
  )
}, "Config")
