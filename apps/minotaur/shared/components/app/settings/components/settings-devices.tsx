import { reatomComponent } from "@reatom/npm-react";
import { lazy } from "react";
import { appState } from "@/shared/models/app/index.model";
import { SettingsContentWrapper, SettingsSection } from "./ui";
import { type SettingsSectionItem } from "@/shared/components/app/settings/models/settings.model";
import { SessionsList } from "./settings-sessions";
import { ClientOnly } from "vike-react/ClientOnly";
import { translate } from "@/shared/locales/helpers";

const ConnectNewSession = lazy(() => import("./settings-new-session").then(m => ({ default: m.ConnectNewSession })))

const SettingsSessions = reatomComponent(({ ctx }) => {
  const isMobile = ctx.spy(appState.inited.isMobile)

  return (
    <div className="flex flex-col gap-4 w-full">
      <ClientOnly>
        {isMobile && <ConnectNewSession />}
      </ClientOnly>
      <SessionsList />
    </div>
  )
}, "AccountSessions")

const DEVICES_SECTIONS: SettingsSectionItem[] = [
  {
    title: translate["settings.devices.sections.sessions.title"](),
    description: translate["settings.devices.sections.sessions.description"](),
    children: <SettingsSessions />
  },
]

export const SettingsDevices = () => {
  return (
    <SettingsContentWrapper title={translate["settings.devices.title"]()}>
      <div className="flex flex-col gap-8 w-full h-full">
        {DEVICES_SECTIONS.map((section, idx) => <SettingsSection key={idx} {...section} />)}
      </div>
    </SettingsContentWrapper>
  )
}
