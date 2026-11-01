import { menuVariant } from "@/shared/ui/menu"
import { Menu } from "@ark-ui/react/menu"
import { Portal } from "@ark-ui/react/portal"
import { reatomComponent } from "@reatom/npm-react"
import { lands } from "../../private/models/lands.model"
import { Icon } from "@/shared/ui/icon"
import { translate } from "@/shared/locales/helpers"

export const LandAccess = reatomComponent<{ ulid: string }>(({ ctx, ulid }) => {
  return (
    <div className="flex items-center gap-2 border overflow-hidden border-neutral-800 rounded-xl">
      <Menu.Root
        onSelect={(details) => {
          if (details.value === "delete") {
            lands.delete(ctx, ulid)
          }
        }}
      >
        <Menu.Trigger
          className={menuVariant.trigger("h-8 w-8 hover:bg-neutral-700 border-neutral-700 border p-1")}
        >
          <Icon name="sprite:dots-vertical" className="size-4 text-neutral-400" />
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content className={menuVariant.content()}>
              <Menu.Item value="delete" className={menuVariant.item()}>
                {translate["land.editing.delete"]()}
              </Menu.Item>
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
    </div>
  )
}, "LandAccess")
