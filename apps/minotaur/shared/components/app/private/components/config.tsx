import { newsSection } from "./news"
import { actionsState, type ActionParent, type ActionType } from "../models/actions.model"
import { type ReactNode } from "react"
import { bannersSection } from "./banners"
import { dictionariesSection } from "./dictionaries"
import { eventsSection } from "./events"
import { reatomComponent } from "@reatom/npm-react"
import { WithHeader, SectionWrapper } from "./ui"
import { Roles } from "./roles"
import { Methods } from "./methods"
import { Options } from "./options"
import { atom } from "@reatom/framework"
import { modpackSection } from "./modpack"
import { landsSection } from "./lands"
import { apiKeysSection } from "./api"
import { Typography } from "@/shared/ui/typography"

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

const ActionsHeaderSlot = reatomComponent<{ parent: ActionParent }>(({ ctx, parent }) => {
  const Component = ctx.spy(actionsHeaderComponentAtom(parent));
  if (!Component) return null;
  return <Component />
}, "ActionsHeaderSlot")

type ConfigSectionProps = {
  id: string
  title: string
  action?: ReactNode
  children: ReactNode
}

const ConfigSection = ({ id, title, action, children }: ConfigSectionProps) => {
  return (
    <SectionWrapper id={id} className="flex flex-col gap-2 w-full scroll-mt-24">
      <div className="flex items-center justify-between gap-2 w-full">
        <Typography className="text-base font-semibold">{title}</Typography>
        {action}
      </div>
      <div className="flex flex-col gap-2 w-full">
        {children}
      </div>
    </SectionWrapper>
  )
}

type SectionBase = { id: string, title: string }

const SECTIONS: SectionBase[] = [
  { id: "config-general", title: "Основное" },
  { id: "config-roles", title: "Роли" },
  { id: "config-events", title: "Ивенты" },
  { id: "config-modpacks", title: "Модпаки" },
  { id: "config-banners", title: "Баннеры" },
  { id: "config-news", title: "Новости" },
  { id: "config-dictionaries", title: "Справочник" },
  { id: "config-api", title: "API Ключи" },
  { id: "config-lands", title: "Регионы" },
]

const ConfigNav = () => {
  const jump = (id: SectionBase["id"]) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <nav
      className="
        sticky top-14 lg:top-2 z-20 flex items-center gap-1 overflow-x-auto
        rounded-xl border border-neutral-800 bg-neutral-900 p-2 scrollbar-h-1
      "
    >
      {SECTIONS.map(({ id, title }) => (
        <button
          key={id}
          type="button"
          onClick={() => jump(id)}
          className="
            shrink-0 rounded-lg px-3 py-1 duration-150 hover:bg-neutral-800
            text-sm font-semibold text-neutral-300 hover:text-neutral-50
          "
        >
          {title}
        </button>
      ))}
    </nav>
  )
}

export const Config = () => {
  return (
    <div className="flex flex-col gap-4 w-full h-full">
      <ConfigNav />
      <ConfigSection id="config-general" title="Основное">
        <div className="flex flex-col sm:flex-row gap-2 sm:items-stretch w-full">
          <div className="flex flex-col gap-1 w-full">
            <WithHeader title="Глобальные параметры" />
            <Options />
          </div>
          <div className="flex flex-col gap-1 w-full">
            <WithHeader title="Платежные методы" />
            <Methods />
          </div>
        </div>
      </ConfigSection>
      <ConfigSection id="config-roles" title="Роли">
        <Roles />
      </ConfigSection>
      <ConfigSection
        id="config-events"
        title="Ивенты"
        action={<ActionsHeaderSlot parent="event" />}
      >
        <eventsSection.Wrapper />
      </ConfigSection>
      <ConfigSection
        id="config-modpacks"
        title="Модпаки"
        action={<ActionsHeaderSlot parent="modpack" />}
      >
        <modpackSection.Wrapper />
      </ConfigSection>
      <ConfigSection
        id="config-banners"
        title="Баннеры"
        action={<ActionsHeaderSlot parent="banner" />}
      >
        <bannersSection.Wrapper />
      </ConfigSection>
      <ConfigSection
        id="config-news"
        title="Новости"
        action={<ActionsHeaderSlot parent="news" />}
      >
        <newsSection.Wrapper />
      </ConfigSection>
      <ConfigSection
        id="config-dictionaries"
        title="Справочник"
        action={<ActionsHeaderSlot parent="dictionaries" />}
      >
        <dictionariesSection.Wrapper />
      </ConfigSection>
      <ConfigSection
        id="config-api"
        title="API Ключи"
        action={<ActionsHeaderSlot parent="api" />}
      >
        <apiKeysSection.Wrapper />
      </ConfigSection>
      <ConfigSection
        id="config-lands"
        title="Регионы"
        action={<ActionsHeaderSlot parent="lands" />}
      >
        <landsSection.Wrapper />
      </ConfigSection>
    </div>
  )
}
