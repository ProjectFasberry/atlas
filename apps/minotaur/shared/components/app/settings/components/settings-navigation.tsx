import { Icon, type IconName } from "@/shared/ui/icon"
import {
  settings, settingsNavigationListAtom, settingsNavigationItemIsActiveAtom,
  type SettingsNavigation, type SettingsNavigationNode
} from "../models/settings.model"
import { tv } from "tailwind-variants"
import { reatomComponent } from "@reatom/npm-react"
import { Button } from "@/shared/ui/button"
import { type Ctx, spawn } from "@reatom/framework"

type SettingsNavigationItem = { icon: IconName, className?: string }

const SETTINGS_NAVIGATION_ICONS: Partial<Record<string, Record<string, SettingsNavigationItem>>> = {
  main: {
    account: { icon: "sprite:user-circle" },
    devices: { icon: "sprite:device-desktop" },
    security: { icon: "sprite:shield-half" },
    connections: { icon: "sprite:link" },
    store: { icon: "sprite:building-store" }
  },
  app: {
    appearance: { icon: "sprite:aspect-ratio" },
    language: { icon: "sprite:language" }
  },
  account: {
    logout: {
      className: "text-red", icon: "sprite:logout"
    }
  }
}

const navigationItemNodeVariant = tv({
  base: `flex items-center group font-medium truncate rounded-lg gap-2 h-10 px-2 justify-start`,
  variants: {
    variant: {
      default: "hover:bg-neutral-700", active: "bg-neutral-700"
    }
  },
  defaultVariants: {
    variant: "default"
  }
})

type Handler = (ctx: Ctx, node: SettingsNavigationNode, parent: string) => void;

const AS_EVENTS: Record<NonNullable<SettingsNavigationNode["as"]>, Handler> = {
  "button": (ctx, node) => spawn(ctx, (spawnCtx) => node.cb?.(spawnCtx)),
  "link": (ctx, node, parent) => settings.navigate(ctx, parent, node.value)
}

const NavigationItemNode = reatomComponent<{ parent: string, node: SettingsNavigationNode }>(({
  ctx, node, parent
}) => {
  const isActive = ctx.spy(settingsNavigationItemIsActiveAtom(parent, node.value))
  const variant = isActive ? "active" : "default"

  const iconName = SETTINGS_NAVIGATION_ICONS[parent]?.[node.value]?.icon
  const className = SETTINGS_NAVIGATION_ICONS[parent]?.[node.value]?.className

  return (
    <Button
      data-sound={true}
      onClick={() => AS_EVENTS[node.as ?? "link"](ctx, node, parent)}
      className={navigationItemNodeVariant({ variant, className })}
    >
      {iconName && <Icon name={iconName} className="size-5" />}
      {node.title}
    </Button>
  )
}, "NavigationItemNode")

const NavigationItem = ({ parent, title, nodes }: SettingsNavigation & { parent: string }) => {
  return (
    <div className="flex flex-col gap-2">
      {title && (
        <h2 className="font-semibold line-clamp-2 leading-4 text-sm text-neutral-400">
          {title}
        </h2>
      )}
      <div className="flex flex-col gap-1">
        {nodes.map((node) => (
          <NavigationItemNode key={`${parent}/${node.value}`} parent={parent} node={node} />
        ))}
      </div>
    </div>
  )
}

const SettingsNavigationList = reatomComponent(({ ctx }) =>
  ctx.spy(settingsNavigationListAtom).map(([key, section]) => <NavigationItem key={key} parent={key} {...section} />)
)

export const SettingsNavigationDesktop = () => {
  return (
    <div className="flex flex-col w-full gap-6">
      <SettingsNavigationList />
    </div>
  )
}
export const SettingsNavigationMobile = () => {
  return (
    <div className="flex flex-col gap-6 mt-4 w-full h-full overflow-x-hidden overflow-y-auto">
      <SettingsNavigationList />
    </div>
  )
}
