import { LOCALES_MAP } from "@/shared/locales"
import { SettingsContentWrapper } from "./ui"
import { getLocale, locales, type Locale } from "@/paraglide/runtime"
import { reatomComponent } from "@reatom/npm-react"
import { locale } from "@/shared/models/shared.model"
import { settings } from "../models/settings.model"
import { checkboxVariant } from "@/shared/ui/checkbox"
import { Checkbox } from "@ark-ui/react/checkbox"
import { translate } from "@/shared/locales/helpers"

const SettingsLanguageListItem = reatomComponent<{ value: Locale }>(({ ctx, value }) => {
  const isActive = getLocale() === value;

  const handle = () => {
    locale.change(ctx, value, () => {
      settings.close(ctx)
    })
  }

  return (
    <button
      className="flex cursor-pointer bg-neutral-800 gap-2 hover:bg-neutral-700 duration-150 ease-in w-full rounded-lg px-4 py-2 items-center"
      onClick={handle}
    >
      <Checkbox.Root
        checked={isActive}
        className={checkboxVariant.root()}
      >
        <Checkbox.Control className={checkboxVariant.control({ variant: "filled" })}/>
        <Checkbox.Label className={checkboxVariant.label()}>
          {LOCALES_MAP[value]}
        </Checkbox.Label>
        <Checkbox.HiddenInput />
      </Checkbox.Root>
    </button>
  )
}, "SettingsLanguageListItem")

const SettingsLanguageList = () => {
  return locales.map((locale) => <SettingsLanguageListItem key={locale} value={locale} />)
}

export const SettingsLanguage = () => {
  return (
    <SettingsContentWrapper title={translate["settings.language.title"]()}>
      <div className="flex flex-col gap-8 w-full h-full">
        <div className="flex flex-col gap-2 w-full h-full">
          <SettingsLanguageList />
        </div>
      </div>
    </SettingsContentWrapper>
  )
}
