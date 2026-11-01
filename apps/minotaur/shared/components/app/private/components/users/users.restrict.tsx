import { reatomComponent } from "@reatom/npm-react"
import { usersRestrictState, usersRestrict, USER_ACTIONS, usersControl, type UserAction } from "../../models/users.model"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import type { AtomMut } from "@reatom/framework"
import { Menu } from "@ark-ui/react/menu"
import { menuVariant } from "@/shared/ui/menu"
import { Portal } from "@ark-ui/react/portal"

type UserActionsWrapperProps =
  | { type: "single", nickname: string }
  | { type: "global", nickname?: never }

type ActionInputProps = {
  atom: AtomMut<string | null>,
  label: string
}
const ActionInput = reatomComponent<ActionInputProps>(({ ctx, atom, label }) => (
  <Input
    value={ctx.spy(atom) ?? ""}
    onChange={e => atom(ctx, e.target.value)}
    placeholder={label}
    className="text-sm!"
  />
), "ActionInput")

type ActionButtonProps = {
  group: string,
  event: string,
  label?: string,
  node: UserActionsWrapperProps
}
const ActionButton = reatomComponent<{ item: ActionButtonProps, isMenuItem?: boolean }>(({ ctx, item, isMenuItem }) => {
  const isPending = ctx.spy(usersRestrict.submit.statusesAtom).isPending
  const label = item.label ?? "Применить";

  if (isMenuItem) {
    return (
      <Menu.Item
        value={item.event}
        className={menuVariant.item()}
        onClick={() => usersControl.start(ctx, item.event, item.group, item.node.nickname)}
        disabled={isPending}
      >
        {label}
      </Menu.Item>
    )
  }

  return (
    <Button
      background="white"
      className="h-8 text-sm font-semibold"
      disabled={isPending}
      onClick={() => usersControl.start(ctx, item.event, item.group, item.node.nickname)}
    >
      {label}
    </Button>
  )
}, "ActionButton")

type ActionMenuNodeProps = UserActionsWrapperProps & {
  item: UserAction
};
const ActionMenuNode = ({ item, ...node }: ActionMenuNodeProps) => {
  if (item.childs) {
    return (
      <Menu.Root key={item.group}>
        <Menu.TriggerItem className={menuVariant.item()}>{item.label}</Menu.TriggerItem>
        <Portal>
          <Menu.Positioner>
            <Menu.Content className={menuVariant.content()}>
              {item.childs.map((child, idx) => (
                <ActionMenuNode
                  key={idx}
                  item={{ ...child, group: item.group }}
                  {...node}
                />
              ))}
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
    )
  }

  if (item.fields) {
    return (
      <Menu.Root key={item.group}>
        <Menu.TriggerItem className={menuVariant.item()}>{item.label}</Menu.TriggerItem>
        <Portal>
          <Menu.Positioner>
            <Menu.Content className={menuVariant.content()}>
              <div className="flex flex-col gap-1 w-full">
                {item.fields.map(({ value, label }) => (
                  // @ts-expect-error
                  <ActionInput key={value} atom={usersRestrictState.fields[value]} label={label} />
                ))}
                {"event" in item && (
                  <ActionButton
                    item={{
                      ...item,
                      node,
                      event: item.event as string,
                    }}
                  />
                )}
              </div>
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
    )
  }

  const event = "event" in item ? item.event as string : undefined
  if (!event) return null;

  return (
    <ActionButton
      key={item.group}
      isMenuItem
      item={{ ...item, node, event }}
    />
  )
}

export const UserActionsWrapper = (props: UserActionsWrapperProps) => (
  USER_ACTIONS.map((group) => <ActionMenuNode key={group.group} item={group} {...props} />)
)
