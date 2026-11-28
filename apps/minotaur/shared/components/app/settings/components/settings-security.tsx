import { SettingsContentWrapper, SettingsSection } from "./ui"
import { type SettingsSectionItem } from "../models/settings.model"
import { translate } from "@/shared/locales/helpers"
import { TwoFactorSettings } from "./settings-two-factor"

const SECURITY_SECTIONS: SettingsSectionItem[] = [
  {
    title: translate["settings.security.two-factor.title"](),
    description: translate["settings.security.two-factor.description"](),
    children: <TwoFactorSettings />
  },
]

export const SettingsMainSecurity = () => {
  return (
    <SettingsContentWrapper title={translate["settings.security.title"]()}>
      <div className="flex flex-col gap-8 w-full h-full">
        {SECURITY_SECTIONS.map((section, idx) => <SettingsSection key={idx} {...section} />)}
      </div>
    </SettingsContentWrapper>
  )
}
