import { LOCALES_MAP, LOCALES_NATIVE_MAP } from "@/shared/locales"
import { SettingsContentWrapper } from "./ui"
import { locales, type Locale } from "@/paraglide/runtime"
import { reatomComponent, useIsomorphicEffect } from "@reatom/npm-react"
import { locale, localeState } from "@/shared/models/shared.model"
import { hasLocaleCookie } from "@/shared/lib/locale"
import { settings } from "../models/settings.model"
import { Icon } from "@/shared/ui/icon"
import { Typography } from "@/shared/ui/typography"
import { translate } from "@/shared/locales/helpers"
import { clsx } from "cnfast"

const LOCALE_BADGES: Record<Locale, string> = {
  "en": "EN",
  "ru": "RU",
}

const cardClass = (isActive: boolean) => clsx(
  "flex w-full cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 duration-150",
  isActive
    ? "border-green-500/50 bg-neutral-800"
    : "border-neutral-800 bg-neutral-900 hover:border-neutral-700 hover:bg-neutral-800",
)

const SettingsLanguageListItem = reatomComponent<{ value: Locale }>(({ ctx, value }) => {
  const isActive = ctx.spy(localeState.current) === value;
  const secondary = LOCALES_NATIVE_MAP[value] === LOCALES_MAP[value] ? null : LOCALES_MAP[value]

  const handle = () => {
    locale.change(ctx, value, () => {
      settings.close(ctx)
    })
  }

  return (
    <button
      type="button"
      onClick={handle}
      aria-pressed={isActive}
      className={cardClass(isActive)}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg
        bg-neutral-800 text-xs font-semibold uppercase text-neutral-300">
        {LOCALE_BADGES[value]}
      </span>
      <span className="flex min-w-0 flex-1 flex-col items-start">
        <span className="truncate text-sm font-semibold">{LOCALES_NATIVE_MAP[value]}</span>
        {secondary && <span className="truncate text-xs text-neutral-400">{secondary}</span>}
      </span>
      {isActive && <Icon name="sprite:check" className="size-5 shrink-0 text-green-400" />}
    </button>
  )
}, "SettingsLanguageListItem")

const SettingsLanguageList = () => {
  return locales.map((locale) => <SettingsLanguageListItem key={locale} value={locale} />)
}

const SettingsLanguageAuto = reatomComponent(({ ctx }) => {
  const isActive = ctx.spy(localeState.isAuto)

  const handle = () => {
    locale.auto(ctx)
    settings.close(ctx)
  }

  return (
    <button
      type="button"
      onClick={handle}
      aria-pressed={isActive}
      className={cardClass(isActive)}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-neutral-800">
        <Icon name="sprite:language" className="size-5 text-neutral-300" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col items-start">
        <span className="truncate text-sm font-semibold">
          {translate["settings.language.auto.title"]()}
        </span>
        <span className="truncate text-xs text-neutral-400">
          {translate["settings.language.auto.description"]()}
        </span>
      </span>
      {isActive && <Icon name="sprite:check" className="size-5 shrink-0 text-green-400" />}
    </button>
  )
}, "SettingsLanguageAuto")

const SettingsLanguagePreview = reatomComponent(({ ctx }) => {
  const current = ctx.spy(localeState.current)
  const date = new Intl.DateTimeFormat(current, {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(2026, 10, 17, 14, 30))
  const number = new Intl.NumberFormat(current).format(1234567.89)

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-neutral-900 p-4">
      <Typography className="text-sm font-semibold">
        {translate["settings.language.preview"]()}
      </Typography>
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-neutral-400">
        <span>
          {translate["settings.language.preview.date"]()}:{" "}
          <span className="text-neutral-100">{date}</span>
        </span>
        <span>
          {translate["settings.language.preview.number"]()}:{" "}
          <span className="text-neutral-100">{number}</span>
        </span>
      </div>
    </div>
  )
}, "SettingsLanguagePreview")

const LanguageAutoSync = reatomComponent(({ ctx }) => {
  useIsomorphicEffect(() => {
    localeState.isAuto(ctx, !hasLocaleCookie())
  }, [ctx])

  return null
}, "LanguageAutoSync")

export const SettingsLanguage = () => {
  return (
    <SettingsContentWrapper
      title={translate["settings.language.title"]()}
      description={translate["settings.language.description"]()}
    >
      <div className="flex h-full w-full flex-col gap-4">
        <LanguageAutoSync />
        <SettingsLanguageAuto />
        <SettingsLanguageList />
        <SettingsLanguagePreview />
      </div>
    </SettingsContentWrapper>
  )
}
