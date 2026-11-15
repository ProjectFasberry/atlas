import { type ReactNode } from "react"
import { atom } from "@reatom/framework"
import { reatomComponent } from "@reatom/npm-react"
import { actionsState, type ActionParent, type ActionType } from "../models/actions.model"
import { newsSection } from "./news"
import { bannersSection } from "./banners"
import { dictionariesSection } from "./dictionaries"
import { eventsSection } from "./events"
import { modpackSection } from "./modpack"
import { landsSection } from "./lands"
import { apiKeysSection } from "./api"

type ComponentType = Nullable<() => ReactNode>;

const COMPONENTS: Record<string, Partial<Record<ActionType, ComponentType>>> = {
  "news": {
    "create": newsSection.Header.Create,
    "edit": newsSection.Header.Edit,
    "view": newsSection.Header.View
  },
  "modpack": {
    "create": modpackSection.Header.Create,
    "edit": modpackSection.Header.Edit,
    "view": modpackSection.Header.View
  },
  "event": {
    "create": eventsSection.Header.Create,
    "edit": eventsSection.Header.Edit,
    "view": eventsSection.Header.View,
  },
  "banner": {
    "create": bannersSection.Header.Create,
    "edit": bannersSection.Header.Edit,
    "view": bannersSection.Header.View,
  },
  "dictionaries": {
    "create": dictionariesSection.Header.Create,
    "edit": dictionariesSection.Header.Edit,
    "view": dictionariesSection.Header.View,
  },
  "lands": {
    "create": landsSection.Header.Create,
    "edit": landsSection.Header.Edit,
    "view": landsSection.Header.View,
  },
  "api": {
    "create": apiKeysSection.Header.Create,
    "edit": apiKeysSection.Header.Edit,
    "view": apiKeysSection.Header.View
  }
}

const actionsHeaderComponentAtom = (parent: ActionParent) => atom((ctx): ComponentType => {
  const targetParent = ctx.spy(actionsState.parent)
  if (!targetParent) return COMPONENTS[parent]?.view ?? null

  if (parent !== targetParent) return null;

  const targetType = ctx.spy(actionsState.type);
  return COMPONENTS[parent][targetType] ?? null
})

export const ActionsHeaderSlot = reatomComponent<{ parent: ActionParent }>(({ ctx, parent }) => {
  const Component = ctx.spy(actionsHeaderComponentAtom(parent));
  if (!Component) return null;
  return <Component />
}, "ActionsHeaderSlot")
