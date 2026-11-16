import {
  baseLocale,
  cookieName,
  extractLocaleFromNavigator,
  isLocale,
  toLocale,
  type Locale,
} from "@/paraglide/runtime"

export const isAvailableLang = (lang: string): lang is Locale => isLocale(lang)

/** Whether the user explicitly picked a locale instead of relying on the browser. */
export const hasLocaleCookie = () => {
  if (typeof document === "undefined") return false

  return document.cookie.split(";").some((cookie) => cookie.trim().startsWith(`${cookieName}=`))
}

/**
 * Browser-preferred locale. An explicit list is accepted for tests; otherwise
 * Paraglide's own negotiator is used.
 */
export const detectBrowserLocale = (preferred?: readonly string[]): Locale => {
  if (!preferred) return extractLocaleFromNavigator() ?? baseLocale

  for (const tag of preferred) {
    const locale = toLocale(tag?.split("-")[0] ?? "")

    if (locale) return locale
  }

  return baseLocale
}
