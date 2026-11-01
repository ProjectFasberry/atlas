import { action, atom, withAssign, connectLogger, type Unsubscribe, withInit, type Ctx, createLogBatched, type AtomCache } from "@reatom/framework";
import type { PageContext } from "vike/types";
import { withSsr } from "../ssr";
import { parseBoolean } from "../../lib/utils";
import { detectMobile } from "@/shared/lib/helpers";
import { detectHardwareAcceleration } from "@/shared/lib/helpers";
import { ENVIRONMENT } from "../../consts";
import { getIsAuthed, maybeSpyOptionAtom } from "./utils";
import { snapshots } from "../ssr";
import { pageState } from "../page-context.model";
import { logger } from "@/shared/lib/logger";
import { sound } from "../sounds.model";

export const APP_OPTIONS_KEY = "appState.options" as const;
export const APP_DICTIONARIES_KEY = "appState.dict" as const;
export const MOBILE_BREAKPOINT = 1024 - 1

export type AppOptionsPayload = ExtractApiData<"getAppOptions">["data"]
export type AppOptionsPayloadExtend = AppOptionsPayload
export type AppDictionaries = Record<string, string>

let DEVTOOLS_ENABLED = true;

export const appState = atom(null, "appState").pipe(
  withAssign((_, name) => ({
    current: atom(null, `${name}.current`).pipe(
      withAssign((_, name) => ({
        isMobile: atom(false, `${name}.isMobile`).pipe(withSsr(`${name}.isMobile`)),
      }))
    ),
    inited: atom(null, `${name}.inited`).pipe(
      withAssign((_, name) => ({
        isMobile: atom(false, `${name}.isMobile`),
        hardwaveIsEnabled: atom(false, `${name}.hardwaveIsEnabled`).pipe(
          withInit(() => detectHardwareAcceleration())
        )
      }))
    ),
    options: atom<Nullable<AppOptionsPayloadExtend>>(null, `${name}.options`).pipe(withSsr(APP_OPTIONS_KEY)),
    dict: atom<Nullable<AppDictionaries>>(null, `${name}.dict`).pipe(withSsr(APP_DICTIONARIES_KEY))
  })),
);

export const userState = atom(null, "userState").pipe(
  withAssign((_, name) => ({
    geo: atom(null, `${name}.geo`).pipe(
      withAssign((_, name) => ({
        country: atom((ctx) => null, `${name}.country`)
      }))
    ),
    isAuthed: atom((ctx) => {
      if (ENVIRONMENT === 'server') {
        return getIsAuthed()
      }
      return maybeSpyOptionAtom(ctx, "flags", "isAuthed", false)
    }, `${name}.isAuthed`)
  }))
)

export const getDevModulesInfo = (ctx: Ctx) => {
  const isMobile = ctx.get(appState.inited.isMobile)
  if (isMobile) return;

  const stage = maybeSpyOptionAtom(ctx, "state", "stage", "prod")
  const ALLOWED_STAGE: typeof stage[] = ["staging"];

  return {
    isImport: import.meta.env.DEV ? true : ALLOWED_STAGE.includes(stage),
    by: import.meta.env.DEV ? "environment" : "stage"
  }
}

const lazyInitDevModules = action(async (ctx, by: string) => {
  try {
    const validateImport = <T>(cd: boolean, fn: () => Promise<T>): Promise<T | null> =>
      cd ? fn() : Promise.resolve(null);

    const [devtools] = await Promise.all([
      validateImport(DEVTOOLS_ENABLED, () => import("../devtools/index.model").then(m => m.devtools))
    ]);

    const modules = [
      { name: 'Devtools', ref: devtools },
    ];

    for (const mod of modules) {
      if (!mod || !mod.ref) return;

      try {
        mod.ref.init(ctx);
        logger.withTag(mod.name).log(`Load by ${by}`);
      } catch (e) {
        logger.withTag(mod.name).warn(`${mod.name} failed to init:`, e);
      }
    }
  } catch (e) {
    console.error("Error loading optional modules:", e);
  }
})

const loggerIsConnectedAtom = atom(false)

export const app = atom(null, "app").pipe(
  withAssign((_, name) => ({
    /** Executed once on the server and once on the client. */
    preInit: action((ctx, rootSnapshot: Snapshot) => {
      snapshots.init(ctx, rootSnapshot)
    }, `${name}.preInit`),
    initReatomLogger: action((ctx) => {
      const isConnected = ctx.get(loggerIsConnectedAtom);
      if (isConnected) return;

      connectLogger(ctx, {
        showCause: true,
        skipUnnamed: true,
        skip: (patch: AtomCache) => false,
        log: createLogBatched(
          {
            debounce: 400,
            limit: 5000,
            getTimeStamp: () => new Date().toLocaleTimeString(),
            log: console.log,
            shouldGroup: false,
          },
        ),
      })

      loggerIsConnectedAtom(ctx, true)
    }),
    init: action((ctx) => {
      let unsubs: Unsubscribe[] = [];

      appState.inited.isMobile(ctx, detectMobile());

      const { onChange, unsub } = updateReactiveIsMobile(ctx)
      onChange();

      unsubs.push(unsub)

      const devModulesInfo = getDevModulesInfo(ctx)

      if (devModulesInfo?.isImport) {
        /** only fire and forget */
        lazyInitDevModules(ctx, devModulesInfo.by)
      }

      defineTags(ctx);

      sound.init(ctx)
        .then(() => {
          defineListeners(ctx);
        })

      return () => unsubs.forEach(un => { un() })
    }, `${name}.init`),
    sync: action((ctx, pageCtx: PageContext) => {
      pageState.urlParsed(ctx, pageCtx.urlParsed);
      pageState.urlPathname(ctx, pageCtx.urlPathname);
      pageState.routeParams(ctx, pageCtx.routeParams);
      pageState.isClientside(ctx, !!pageCtx.Page)
      pageState.data(ctx, pageCtx.data ?? null);
      snapshots.init(ctx, pageCtx.snapshot);
    }, `${name}.sync`),
  }))
)

const defineTags = action((ctx) => {
  function addMaximumScaleToMetaViewport() {
    const el = document.querySelector('meta[name=viewport]');

    if (el !== null) {
      let content = el.getAttribute('content');
      if (!content) return;

      let re = /maximum-scale=[0-9.]+/g;

      if (re.test(content)) {
        content = content.replace(re, 'maximum-scale=1.0');
      } else {
        content = [content, 'maximum-scale=1.0'].join(', ')
      }

      el.setAttribute('content', content);
    }
  };

  const checkIsIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  if (checkIsIOS()) {
    addMaximumScaleToMetaViewport();
  }
}, "defineTags");

const defineListeners = action((ctx) => {
  function addSoundInterceptor() {
    document.body.addEventListener('click', (event) => {
      if (!(event.target instanceof Element)) return;

      const target = event.target.closest('button')
        ?? event.target.closest('a')
        ?? event.target.closest("div");

      if (!target) return;

      const isSound = target.dataset.sound;

      if (isSound && parseBoolean(isSound)) {
        sound.play(ctx, "click");
      }
    });
  };

  addSoundInterceptor()
}, "defineListeners")

const updateReactiveIsMobile = action((ctx) => {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)

  const onChange = () => appState.current.isMobile(ctx, mql.matches)
  mql.addEventListener("change", onChange)

  return {
    onChange,
    unsub: () => mql.removeEventListener("change", onChange)
  }
}, "updateReactiveIsMobile")
