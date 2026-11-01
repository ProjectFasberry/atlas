import { atom, withAssign } from "@reatom/framework";
import { withSsr } from "./ssr";
import type { Locale } from "@/paraglide/runtime";

export const appState = atom(null, "appState").pipe(
  withAssign((_, name) => ({
    selectedWeather: atom<string>("clean", `${name}.selectedWeather`),
    locale: atom<Locale>("ru", "locale").pipe(withSsr("locale"))
  }))
)
