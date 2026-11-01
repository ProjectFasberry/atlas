import { action, atom, sleep, withAssign, withConcurrency, withReset, type Ctx } from "@reatom/framework";
import { createListCollection } from "@ark-ui/solid/select";
import { setLocale, type Locale } from "@/paraglide/runtime";
import { translate } from "@/shared/locales/helpers";
import { appState } from "@/shared/models/app.model";

export type Weather = {
  title: string;
  value: string;
}
type Language = {
  title: string;
  value: string;
}
const createWeathers = (): Weather[] => ([
  { title: translate["weathers.variants.sunny"](), value: "clean" },
  { title: translate["weathers.variants.rainy"](), value: "rain" },
  { title: translate["weathers.variants.snowy"](), value: "snow" }
]);
const createLanguages = (): Language[] => ([
  { title: translate["languages.variants.russian"](), value: "ru" },
  { title: translate["languages.variants.english"](), value: "en" },
])

export const languages = createLanguages();
export const weathers = createWeathers();

export const settingsListAtom = atom((ctx) => {
  return {
    weather: {
      title: translate["weathers.title"](),
      list: weathers,
      collection: createListCollection({ items: weathers }),
      onChange: (value: unknown) => layoutSettings.wrap(ctx, () => appState.selectedWeather(ctx, value as string)),
      current: atom((ctx) =>
        weathers.find(d => d.value === ctx.spy(appState.selectedWeather)) ?? weathers[0]
      )
    },
    language: {
      title: translate["languages.title"](),
      list: languages,
      collection: createListCollection({ items: languages }),
      onChange: (value: unknown) => layoutSettings.wrap(ctx, () => setLocale(value as Locale)),
      current: atom((ctx) =>
        languages.find(d => d.value === ctx.spy(appState.locale)) ?? languages[0]
      )
    }
  }
})

export const layoutSettings = atom(null, "layoutSettings").pipe(
  withAssign((_, name) => ({
    open: action(async (ctx) => {
      layoutSettingsState.isTriggered(ctx, true);

      await ctx.schedule(() => sleep(150));

      layoutSettingsState.isOpen(ctx, true);
      layoutSettingsState.isTriggered.reset(ctx);
    }, `${name}.open`).pipe(
      withConcurrency()
    ),
    wrap: action((ctx, cb: () => void) => {
      layoutSettingsState.isOpen(ctx, false);
      cb();
    })
  }))
)

export const layoutSettingsState = atom(null, "layoutSettingsState").pipe(
  withAssign((_, name) => ({
    isOpen: atom(false, `${name}.isOpen`),
    isTriggered: atom(false, `${name}.isTriggered`).pipe(withReset()),
  }))
)
