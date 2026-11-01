import { reatomComponent } from "@reatom/npm-react"
import { settingsState } from "../models/settings.model"
import type { JSX } from "react"
import { SettingsAccount } from "./settings-account"
import { SettingsNavigationMobile } from "./settings-navigation"
import { SettingsLanguage } from "./settings-language"
import { SettingsDevices } from "./settings-devices"
import { SettingsMainSecurity } from "./settings-security"
import { SettingsMainConnections } from "./settings-connections"
import { SettingsStore } from "./settings-store"
import { SettingsAppearance } from "./settings-appearance"

const SETTINGS_NODES: Partial<Record<string, Record<string, () => JSX.Element>>> = {
  main: {
    account: SettingsAccount,
    devices: SettingsDevices,
    security: SettingsMainSecurity,
    connections: SettingsMainConnections,
    store: SettingsStore
  },
  app: {
    appearance: SettingsAppearance,
    language: SettingsLanguage
  }
}

export const SettingsContentMobile = reatomComponent(({ ctx }) => {
  const child = ctx.spy(settingsState.target)?.child;
  if (!child) return <SettingsNavigationMobile />

  const parent = ctx.spy(settingsState.target).parent;
  const Component = SETTINGS_NODES[parent]?.[child];

  return Component ? <Component/> : null;
}, "SettingsContentMobile")

export const SettingsContentDesktop = reatomComponent(({ ctx }) => {
  const child = ctx.spy(settingsState.target)?.child;
  if (!child) return null;

  const parent = ctx.spy(settingsState.target).parent
  const node = SETTINGS_NODES[parent]
  if (!node) return null;

  const Component = node[child];
  return Component ? <Component /> : null;
}, "SettingsContent")
