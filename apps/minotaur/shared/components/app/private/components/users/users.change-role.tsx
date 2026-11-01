import { getFromDictionary } from "@/shared/models/app/utils"
import { reatomComponent } from "@reatom/npm-react"
import { Typography } from "@/shared/ui/typography"
import { usersRoles, usersRestrictState } from "../../models/users.model"
import { Icon } from "@/shared/ui/icon"
import { Button } from "@/shared/ui/button"
import { Skeleton } from "@/shared/ui/skeleton"
import { type Role as RoleType } from "@/shared/components/app/private/models/users.model"
import { itemVariant } from "../ui"
import { Menu } from '@ark-ui/react/menu'
import { menuVariant } from "@/shared/ui/menu"

const UserActionsChangeRoleGlobalSubmit = reatomComponent(({ ctx }) => {
  const isDisabled = !ctx.spy(usersRestrictState.targetRoleId)
    || ctx.spy(usersRoles.submit.statusesAtom).isPending

  return (
    <Button
      background="white"
      className="font-semibold"
      disabled={isDisabled}
      onClick={() => usersRoles.before(ctx, [], { type: "change_role" })}
    >
      Применить
    </Button>
  )
}, "UserActionsChangeRoleGlobalSubmit")

const UserActionsChangeRoleSubmit = reatomComponent<{ nickname: string }>(({ ctx, nickname }) => {
  const isDisabled = !ctx.spy(usersRestrictState.targetRoleId)
    || ctx.spy(usersRoles.submit.statusesAtom).isPending

  return (
    <Button
      background="white"
      className="font-semibold"
      disabled={isDisabled}
      onClick={() => usersRoles.before(ctx, [nickname], { type: "change_role" })}
    >
      Применить
    </Button>
  )
}, "UserActionsChangeRoleSubmit")

const Role = reatomComponent<RoleProps>(({ ctx, name, id, selectedId, onClick }) => {
  const title = getFromDictionary(ctx, name)
  const isSelected = selectedId === id;

  return (
    <div
      className={itemVariant({ variant: isSelected ? "selected" : "default" })}
      onClick={() => onClick(id)}
    >
      <Typography>{title}</Typography>
    </div>
  )
}, "Role")

const RolesSkeleton = () => Array.from({ length: 3 }).map((_, idx) => <Skeleton key={idx} className="h-10 w-full" />)

type RoleProps = RoleType & {
  onClick: (id: number) => void
  selectedId?: number
}

const Roles = reatomComponent<Pick<RoleProps, "onClick" | "selectedId">>(({ ctx, selectedId, onClick }) => {
  const data = ctx.spy(usersRoles.fetch.dataAtom)

  if (ctx.spy(usersRoles.fetch.statusesAtom).isPending) return <RolesSkeleton />;
  if (!data) return null;

  return data.map((role) => (
    <Role
      key={role.id}
      {...role}
      selectedId={selectedId}
      onClick={onClick}
    />
  ))
}, "Roles")

export const UserActionsChangeRoleGlobal = reatomComponent(({ ctx }) => {
  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button background="default" className="p-0 h-8 w-8 aspect-square">
          <Icon name="sprite:dots-vertical" className="size-4" />
        </Button>
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content className={menuVariant.content()}>
          <Menu.Arrow className={menuVariant.arrow()}>
            <Menu.ArrowTip className={menuVariant.arrowTip()} />
          </Menu.Arrow>
          <div className="flex flex-col gap-2 p-2 w-full h-full min-w-40">
            <Typography className="text-neutral-400">
              Доступные роли
            </Typography>
            <div className="flex flex-col gap-1 w-full h-full">
              <Roles onClick={(roleId) => usersRestrictState.targetRoleId(ctx, roleId)} />
            </div>
            <UserActionsChangeRoleGlobalSubmit />
          </div>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root >
  )
}, "UserActionsChangeRoleGlobal")

export const UserActionsChangeRoleLocal = reatomComponent<{
  nickname: string, role_id: number, role_name: string
}>(({
  ctx, nickname, role_id, role_name
}) => {
  const openedId = ctx.spy(usersRestrictState.selectedId)
  const isThisOpen = openedId === nickname

  const roleTitle = getFromDictionary(ctx, role_name)

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button background="white" className="flex py-1 gap-1 items-center justify-center max-w-36 px-2 h-5">
          <Icon name="sprite:pencil" className="size-[12px]" />
          <Typography className='select-none text-sm leading-4'>
            {roleTitle}
          </Typography>
        </Button>
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content className={menuVariant.content()}>
          <Menu.Arrow className={menuVariant.arrow()}>
            <Menu.ArrowTip className={menuVariant.arrowTip()} />
          </Menu.Arrow>
          <div className="flex flex-col gap-2 p-2 w-full h-full min-w-40">
            <Typography className="text-sm text-neutral-400">
              Доступные роли
            </Typography>
            <div className="flex flex-col gap-1 w-full h-full">
              <Roles
                selectedId={ctx.spy(usersRestrictState.targetRoleId) ?? role_id}
                onClick={(roleId) => usersRestrictState.targetRoleId(ctx, roleId)}
              />
            </div>
            <UserActionsChangeRoleSubmit nickname={nickname} />
          </div>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  )
}, "UserActionsChangeRoleLocal")
