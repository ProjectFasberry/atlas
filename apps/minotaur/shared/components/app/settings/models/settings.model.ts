import { type Action, action, atom, reatomAsync, spawn } from "@reatom/framework"
import { withAssign } from "@reatom/framework"
import { isDeepEqual, sleep, withInit, withReset } from "@reatom/framework"
import { type ReactNode } from "react"
import { logout } from "../../auth/models/logout.model"
import { listenBackOnce } from "@/shared/lib/events"
import { withUndo } from '@reatom/undo'
import { appState } from "@/shared/models/app/index.model"
import { DIALOG_DELAY } from "@/shared/consts/index"
import { translate } from "@/shared/locales/helpers"
import { isEmpty } from "@/shared/lib/utils"

export type SettingsNavigationNode = {
  title: string,
  value: string,
  as?: "link" | "button",
  cb?: Action<[], void>
}
export type SettingsNavigation = {
  title?: string,
  nodes: Array<SettingsNavigationNode>
}

export type SettingsSectionItem = {
  title: string,
  description: string,
  children: ReactNode
}

const getSettings = (): Record<string, SettingsNavigation> => ({
  main: {
    title: translate["settings.main"](),
    nodes: [
      { title: translate["settings.account.title"](), value: "account" },
      // { title: "Безопасность", value: "security" },
      { title: translate["settings.devices.title"](), value: "devices" },
      { title: translate["settings.connections.title"](), value: "connections" },
      { title: translate["settings.store.title"](), value: "store" }
    ]
  },
  app: {
    title: translate["settings.app"](),
    nodes: [
      { title: translate["settings.appearance.title"](), value: "appearance" },
      { title: translate["settings.language.title"](), value: "language" }
    ]
  },
  account: {
    nodes: [
      { title: translate["settings.logout.title"](), value: "logout", as: "button", cb: logout.withConfirm }
    ]
  }
})

type SettingsStateTarget = {
  parent: string,
  child: string | null
}

const targetInitial = { parent: "main" as const, child: null };

const getFallbackSection = action((ctx): SettingsStateTarget => {
  const data = ctx.get(settingsState.data);
  if (!data || isEmpty(data)) return targetInitial;

  const [parent, child] = Object.entries(data)[0];

  if (!child?.nodes || !child.nodes[0]) {
    throw new Error("No fallback section found")
  }

  const childNode = child.nodes[0];

  return {
    parent: parent,
    child: childNode.value
  }
})

export const settingsState = atom(null, "settingsState").pipe(
  withAssign((_, name) => ({
    data: atom(getSettings(), `${name}.data`),
    isOpen: atom(false, `${name}.isOpen`),
    cleanup: atom<{ cb: () => void } | null>(null).pipe(withReset()),
    target: atom<SettingsStateTarget>(targetInitial, `${name}.target`).pipe(
      withUndo({ length: 100 }),
      withReset(),
      withInit((ctx) => {
        const isMobile = ctx.get(appState.current.isMobile);

        if (isMobile) {
          return { parent: "main" as const, child: null }
        }

        return getFallbackSection(ctx)
      })
    )
  }))
)
settingsState.isOpen.onChange((ctx, state) =>
  spawn(ctx, (spawnCtx) => state ? settings.open(spawnCtx) : settings.close(spawnCtx))
)

export const settingsNavigationListAtom = atom((ctx) => Object.entries(ctx.spy(settingsState.data)), `settingsNavigationList`);

export const settings = atom(null, "settings").pipe(
  withAssign((_, name) => ({
    navigate: action((ctx, parent: string, child: string) => {
      settingsState.target(ctx, { parent, child });

      if (!ctx.get(settingsState.cleanup)) {
        const cb = listenBackOnce(() => settings.back(ctx));
        settingsState.cleanup(ctx, { cb });
      } else {
        window.history.pushState({ active: true }, '');
      }
    }),
    open: action((ctx) => {
      settingsState.isOpen(ctx, true)
    }, `${name}.open`),
    close: reatomAsync(async (ctx) => {
      settingsState.isOpen(ctx, false)

      await ctx.schedule(() => sleep(DIALOG_DELAY))

      const currValue = ctx.get(settingsState.isOpen)

      if (!currValue) {
        settingsState.target.reset(ctx);
        settingsState.cleanup.reset(ctx);
      }
    }, `${name}.close`),
    back: action((ctx) => {
      settingsState.target.undo(ctx)

      const history = ctx.get(settingsState.target.isUndoAtom);

      if (!history) {
        const cleanup = ctx.get(settingsState.cleanup)?.cb;
        cleanup?.();

        settingsState.isOpen(ctx, false)
        settingsState.cleanup.reset(ctx);
      } else {
        const cb = listenBackOnce(() => settings.back(ctx));
        settingsState.cleanup(ctx, { cb });
      }
    }, `${name}.back`)
  }))
)

export const settingsNavigationItemIsActiveAtom = (parent: string, child: string) => atom((ctx) =>
  isDeepEqual(
    ctx.spy(settingsState.target), { parent, child }
  )
)
