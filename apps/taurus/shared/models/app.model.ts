import { atom, withAssign } from "@reatom/framework";
import { withSsr } from "./ssr";
import type { Locale } from "@/paraglide/runtime";

const WEATHER_COOKIE = "fasberry-weather"
const WEATHERS = ["clean", "rain", "snow"] as const

type Weather = (typeof WEATHERS)[number]

const isWeather = (value: string): value is Weather => (WEATHERS as readonly string[]).includes(value)

const readWeatherCookie = (): Weather => {
  if (typeof document === "undefined") return "clean"

  const match = document.cookie.match(new RegExp(`(?:^|; )${WEATHER_COOKIE}=([^;]*)`))
  const value = match?.[1]

  return value && isWeather(value) ? value : "clean"
}

export const writeWeatherCookie = (value: string) => {
  if (typeof document === "undefined") return

  document.cookie = `${WEATHER_COOKIE}=${isWeather(value) ? value : "clean"}; Path=/; Max-Age=31536000; SameSite=Lax`
}

export const appState = atom(null, "appState").pipe(
  withAssign((_, name) => ({
    // The module reads the cookie in the browser, so the first client render
    // already has the chosen weather instead of flashing the default.
    selectedWeather: atom<string>(readWeatherCookie(), `${name}.selectedWeather`),
    locale: atom<Locale>("ru", "locale").pipe(withSsr("locale"))
  }))
)
