import type { AtomMut, Ctx } from "@reatom/framework"

type ConfigItemMeta<T> =
  | { applyAs: "atom", applyTarget: AtomMut<T> }
  | { applyAs: "static", applyTarget?: never, onChange?: (ctx: Ctx, value: T) => void }
  | { applyAs: "dynamic", applyTarget?: never }

export type ConfigItem<T = unknown> = {
  value: T, __meta: ConfigItemMeta<T>
}

export type DevtoolsConfig = {
  [K: string]: ConfigItem<any> | DevtoolsConfig;
};

const createConfig = <T extends DevtoolsConfig>(config: T): T => config;
const defineItem = <T>(item: ConfigItem<T>) => {
  return item
};

const loggingConfig = createConfig({
  "Snapshots": {
    value: true,
    __meta: { applyAs: "static" }
  },
  "Atoms": {
    value: true,
    __meta: { applyAs: "static" }
  },
  "Actions": {
    value: true,
    __meta: { applyAs: "static" }
  }
})

export const devtoolsConfig = {
  "Logging": loggingConfig,
} satisfies Record<string, DevtoolsConfig>;
