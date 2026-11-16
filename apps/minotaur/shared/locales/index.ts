import type { Locale } from "@/paraglide/runtime"

export const LOCALES_MAP: Record<Locale, string> = {
  "en": "English",
  "ru": "Russian",
}

/** Native names first: the picker must be readable before the locale is active. */
export const LOCALES_NATIVE_MAP: Record<Locale, string> = {
  "en": "English",
  "ru": "Русский",
}
