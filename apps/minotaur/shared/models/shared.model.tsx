import { client } from "../lib/client-wrapper"
import { action, atom, reatomAsync, withErrorAtom, withStatusesAtom, type Ctx, type CtxSpy } from "@reatom/framework";
import { withAssign } from "@reatom/framework";
import { playerSeemsLikePlayersIsShowKey, playerSLPState } from "../components/app/player/models/player-seems-like.model";
import { parseBoolean } from "../lib/utils";
import { parseCookie } from "../lib/cookie-utils";
import type { PageContextServer } from "vike/types";
import { useInView } from "react-intersection-observer";
import { useUpdate } from "@reatom/npm-react";
import { withSsr } from "./ssr";
import { cookieName, getLocale, setLocale, type Locale } from "@/paraglide/runtime";
import { logError } from "../lib/log";
import { detectBrowserLocale, isAvailableLang } from "../lib/locale";
export { detectBrowserLocale, hasLocaleCookie } from "../lib/locale";

export async function getExistNickname(nickname: string) {
  return client.get("/validate/nickname/{nickname}", { params: { path: { nickname } } })
}

type Target<T = unknown> = Record<string, {
  atom: (ctx: Ctx, atom: any) => void, validator?: (value: string | T) => T;
}>

const COOKIE_TARGETS: Target = {
  [playerSeemsLikePlayersIsShowKey]: {
    atom: playerSLPState.settings.isShow, validator: (v) => typeof v === "string" ? parseBoolean(v) : v
  }
};

export const initCookie = action((ctx: Ctx, headers: NonNullable<PageContextServer["headers"]>) => {
  const cookies = parseCookie(headers["cookie"]);
  if (!Object.keys(cookies).length) return;

  for (const [key, value] of Object.entries(cookies)) {
    const target = COOKIE_TARGETS[key as keyof typeof COOKIE_TARGETS];
    if (!target) continue;

    const final = target.validator?.(value) ?? value;
    target.atom(ctx, final);
  }
})

export const createViewerModel = ({ name, logging }: { name: string, logging?: boolean }) => {
  const inViewAtom = atom(false, `${name}.inViewAtom`);

  const Component = () => {
    const { ref, inView } = useInView({
      triggerOnce: false, threshold: 0
    })

    useUpdate((ctx) => inViewAtom(ctx, inView), [inView])

    return (
      <div ref={ref} className="h-px" />
    )
  }

  if (logging) {
    inViewAtom.onChange((_, state) => console.log(inViewAtom.__reatom.name, state))
  }

  return {
    Component,
    inViewAtom
  }
}

type Socials = ExtractApiData<"getMiscSocials">["data"];

export async function fetchSocials() {
  return client.get("/misc/socials")
}

export const socialsAtom = atom<Socials>([], "socials").pipe(withSsr("socials"))

type Currencies = ExtractApiData<"getMiscCurrencies">["data"];

export async function fetchCurrencies() {
  return client.get("/misc/currencies")
}
export const currenciesAtom = atom<Currencies | null>(null, "currencies").pipe(withSsr("currencies"))

export const getCurrencies = (ctx: Ctx | CtxSpy): Currencies => {
  // Currencies are optional bootstrap data: fall back to an empty map instead
  // of crashing store/cart screens when the snapshot has no currencies yet.
  const data = ctx.spy ? ctx.spy(currenciesAtom) : ctx.get(currenciesAtom)
  return data ?? {}
}

export const localeState = atom(null, "localeState").pipe(
  withAssign((_, name) => ({
    /** Bumped after a locale switch: the layout remounts translated content. */
    current: atom<Locale>(getLocale(), `${name}.current`),
    isAuto: atom(false, `${name}.isAuto`)
  }))
)

export const locale = atom(null, "locale").pipe(
  withAssign((_, name) => ({
    change: reatomAsync(async (_, lang: string, cb?: () => void) => {
      if (!isAvailableLang(lang)) {
        console.error(`Language "${lang}" is not available`)
        return;
      }

      await setLocale(lang, { reload: false })
      return { lang, cb }
    }, {
      name: `${name}.change`,
      onFulfill: (ctx, res) => {
        if (!res) return;

        localeState.current(ctx, res.lang as Locale)
        localeState.isAuto(ctx, false)
        res.cb?.()
      },
      onReject: (_, e) => {
        logError(e)
      }
    }).pipe(
      withErrorAtom(),
      withStatusesAtom()
    ),
    auto: reatomAsync(async () => {
      const lang = detectBrowserLocale()

      await setLocale(lang, { reload: false })

      if (typeof document !== "undefined") {
        document.cookie = `${cookieName}=; Max-Age=0; path=/`
      }

      return { lang }
    }, {
      name: `${name}.auto`,
      onFulfill: (ctx, res) => {
        if (!res) return;

        localeState.current(ctx, res.lang)
        localeState.isAuto(ctx, true)
      },
      onReject: (_, e) => {
        logError(e)
      }
    }).pipe(
      withErrorAtom(),
      withStatusesAtom()
    )
  }))
)
