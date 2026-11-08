import { action, atom } from "@reatom/framework"

/** Collapsed sections of the private config page. Missing id means open. */
export const configSectionsOpen = atom<Record<string, boolean>>({}, "configSectionsOpen")

export const toggleConfigSection = action((ctx, id: string) => {
  const current = ctx.get(configSectionsOpen)
  configSectionsOpen(ctx, { ...current, [id]: !(current[id] ?? true) })
}, "toggleConfigSection")
