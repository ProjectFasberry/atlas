import { reatomComponent, useUpdate } from "@reatom/npm-react"
import { atom } from "@reatom/framework"
import { Skeleton } from "@/shared/ui/skeleton"
import { Typography } from "@/shared/ui/typography"
import { Button } from "@/shared/ui/button"
import { ActionButton, AddButton, DeleteButton, EditButton } from "./ui"
import { tv } from "tailwind-variants"
import { Icon } from "@/shared/ui/icon"
import {
  getDeletedPermIsSelectedAtom,
  permission,
  getPermIsSelectedAtom,
  permissionsByRole,
  roleDeletedPermsAtom,
  roleEditableAtom,
  getRoleIsSelectedRoleAtom,
  roleNewPermsAtom,
  rolesIsEditableAtom,
  rolesList,
  saveChangesAction,
  saveChangesIsValidAtom,
  toggleRoleEditAction
} from "../models/roles.model"
import { getFromDictionary } from "@/shared/models/app/utils"
import { scrollableVariant } from "@/shared/consts/style-variants"
import { Menu } from '@ark-ui/react/menu'
import { menuVariant } from "@/shared/ui/menu"
import { Noop } from "@/shared/ui/noop"
import { ErrorBlock } from "@/shared/ui/error-block"
import { Input } from "@/shared/ui/input"

type RolePayload = {
  id: number;
  name: string;
}

const rolesListPermItemVariant = tv({
  base: `
    flex items-center group
    data-[state=active]:bg-green-500/60
    data-[state=inactive]:bg-transparent
    data-[state=deleted]:bg-red/60
    border border-neutral-800 px-2 py-1 rounded-lg justify-between w-full gap-2
  `,
  slots: {
    name: `
      text-base
      group-data-[state=active]:text-neutral-50
      group-data-[state=inactive]:text-neutral-50
      group-data-[state=deleted]:text-neutral-50
    `,
    id: "flex items-center justify-center h-6 min-w-6 aspect-auto w-fit bg-neutral-700 rounded-sm p-1"
  }
})

const rolesPermQuery = atom("", "rolesPermQuery")

const RolesListItemPermsItemSkeleton = () => {
  return (
    <div className={rolesListPermItemVariant().base()}>
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-6" />
      </div>
      <Skeleton className="h-6 w-6" />
    </div>
  )
}

const RolesListItemPermsItem = reatomComponent<RolePayload>(({ ctx, id, name }) => {
  const selected = ctx.spy(getDeletedPermIsSelectedAtom(id));

  return (
    <div
      className={rolesListPermItemVariant().base()}
      data-state={selected ? "deleted" : "inactive"}
    >
      <div className="flex items-center gap-2">
        <Typography className={rolesListPermItemVariant().name()}>
          {name}
        </Typography>
        <div className={rolesListPermItemVariant().id()}>
          <span>{id}</span>
        </div>
      </div>
      {selected
        ? <AddButton onClick={() => permission.addDeletedPermRoleAction(ctx, id)} />
        : <DeleteButton onClick={() => permission.addDeletedPermAction(ctx, { id, name })} />
      }
    </div>
  )
}, "RolesListItemPermsItem")

const RolesListItemNewPermsItem = reatomComponent<RolePayload>(({ ctx, id, name }) => {
  const selected = ctx.spy(getPermIsSelectedAtom(id))

  return (
    <div className={rolesListPermItemVariant().base()} data-state="active">
      <div className="flex items-center gap-2">
        <Typography className={rolesListPermItemVariant().name()}>
          {name}
        </Typography>
        <div className={rolesListPermItemVariant().id()}>
          <span>{id}</span>
        </div>
      </div>
      {selected
        ? <DeleteButton onClick={() => permission.deleteNewPermAction(ctx, id)} />
        : <AddButton onClick={() => permission.addNewPermAction(ctx, { id, name })} />
      }
    </div>
  )
}, "RolesListItemNewPermsItem")

const RolesListItemPermsSkeleton = () => {
  return (
    <>
      <RolesListItemPermsItemSkeleton />
      <RolesListItemPermsItemSkeleton />
      <RolesListItemPermsItemSkeleton />
      <RolesListItemPermsItemSkeleton />
    </>
  )
}

const RolesListItemPerms = reatomComponent(({ ctx }) => {
  const id = ctx.spy(roleEditableAtom)?.id
  const data = ctx.spy(permissionsByRole.fetchList.dataAtom)

  useUpdate((ctx) => id && permissionsByRole.fetchList(ctx, id), [id])

  if (ctx.spy(permissionsByRole.fetchList.statusesAtom).isPending) {
    return <RolesListItemPermsSkeleton />
  }

  if (!data) return <Noop title="пусто" />

  return data.permissions.map((p) => <RolesListItemPermsItem key={p.id} {...p} />)
}, "RolesListItemPerms")


const RolesListItemAvailableItem = reatomComponent<RolePayload>(({ ctx, id, name }) => {
  const selected = ctx.spy(getPermIsSelectedAtom(id))

  return (
    <div
      className={rolesListPermItemVariant().base()}
      data-state={selected ? "active" : "inactive"}
    >
      <div className="flex items-center gap-2">
        <Typography className={rolesListPermItemVariant().name()}>
          {name}
        </Typography>
        <div className={rolesListPermItemVariant().id()}>
          {id}
        </div>
      </div>
      {!selected && <AddButton onClick={() => permission.addNewPermAction(ctx, { id, name })} />}
    </div>
  )
}, "RolesListItemAvailableItem")

const RolesListItemSaveChanges = reatomComponent(({ ctx }) => {
  const isDisabled = !ctx.spy(saveChangesIsValidAtom) || ctx.spy(saveChangesAction.statusesAtom).isPending

  return (
    <ActionButton
      icon="sprite:check"
      onClick={() => saveChangesAction(ctx)}
      disabled={isDisabled}
      variant="selected"
    />
  )
}, "RolesListItemSaveChanges")

const RolesListItemAddPerm = reatomComponent(({ ctx }) => {
  const id = ctx.spy(roleEditableAtom)?.id
  const query = ctx.spy(rolesPermQuery)

  if (!id) return null;

  const availablePerms = ctx.spy(permission.availablePerms)
  const normalized = query.trim().toLowerCase()
  const filtered = normalized
    ? availablePerms.filter((permission) => permission.name.toLowerCase().includes(normalized))
    : availablePerms

  const groups = filtered.reduce<Record<string, typeof availablePerms>>((acc, item) => {
    const namespace = item.name.split(".")[0] ?? "other"
    const list = acc[namespace] ?? []
    list.push(item)
    acc[namespace] = list
    return acc
  }, {})

  const isDisabled = availablePerms.length === 0

  return (
    <Menu.Root onOpenChange={({ open }) => !open && rolesPermQuery(ctx, "")}>
      <Menu.Trigger asChild>
        <Button
          className="gap-2 font-semibold h-8 text-sm bg-neutral-800"
          disabled={isDisabled}
        >
          Добавить
          <Icon name="sprite:plus" className="size-4" />
        </Button>
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content className={menuVariant.content()}>
          <Menu.Arrow className={menuVariant.arrow()}>
            <Menu.ArrowTip className={menuVariant.arrowTip()} />
          </Menu.Arrow>
          <div className="flex flex-col gap-2 p-2 w-full h-fit">
            <Typography className="text-neutral-400 text-sm">
              Доступные разрешения
            </Typography>
            <Input
              value={query}
              onChange={(e) => rolesPermQuery(ctx, e.target.value)}
              onKeyDown={(event) => event.stopPropagation()}
              placeholder="Поиск по названию"
              className="h-8 w-full"
              maxLength={64}
            />
            <div className="flex flex-col scrollbar scrollbar-thumb-neutral-800 gap-2 max-h-[240px] overflow-y-auto w-full">
              {Object.entries(groups).map(([namespace, perms]) => (
                <div key={namespace} className="flex flex-col gap-1">
                  <Typography className="text-[11px] uppercase tracking-wide text-neutral-500">
                    {namespace}
                  </Typography>
                  {perms.map((permission) => (
                    <RolesListItemAvailableItem key={permission.id} {...permission} />
                  ))}
                </div>
              ))}
              {filtered.length === 0 && (
                <Typography className="text-sm text-neutral-500">
                  Ничего не найдено
                </Typography>
              )}
            </div>
          </div>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  )
}, "RolesListItemAddPerm")

const rolesListItemVariant = tv({
  base: `flex flex-col w-full gap-2 border border-neutral-800 rounded-lg p-2`,
  slots: {
    group: "flex items-center justify-between gap-1",
    name: `flex items-center justify-center gap-2`,
  }
})

const RolesListItemSkeleton = () => {
  return (
    <div className={rolesListItemVariant().base()}>
      <div className={rolesListItemVariant().name()}>
        <Skeleton className="h-6 w-24" />
      </div>
      <Skeleton className="h-6 w-6" />
    </div>
  )
}

const RolesListItem = reatomComponent<RolePayload>(({ ctx, id, name }) => {
  const isSelected = ctx.spy(getRoleIsSelectedRoleAtom(id));

  const title = getFromDictionary(ctx, name)

  return (
    <div className={rolesListItemVariant().base()}>
      <div className={rolesListItemVariant().group()}>
        <div className={rolesListItemVariant().name()}>
          <Typography className="text-sm">
            {title}
          </Typography>
        </div>
        <div className="flex gap-1 items-center">
          {isSelected ? (
            <>
              <ActionButton
                icon="sprite:arrow-back-up"
                variant="default"
                onClick={() => toggleRoleEditAction(ctx, { id, name })}
              />
              <RolesListItemSaveChanges />
            </>
          ) : (
            <>
              <EditButton onClick={() => toggleRoleEditAction(ctx, { id, name })} />
            </>
          )}
        </div>
      </div>
      {isSelected && <RolesEditable />}
    </div>
  )
}, "RolesListItem")

const RolesListSkeleton = () => Array.from({ length: 3 }).map((_, idx) => <RolesListItemSkeleton key={idx} />)

const RolesList = reatomComponent(({ ctx }) => {
  useUpdate(rolesList.fetch, []);

  if (ctx.spy(rolesList.fetch.statusesAtom).isFirstPending) {
    return <RolesListSkeleton />
  }

  const error = ctx.spy(rolesList.fetch.errorAtom)
  if (error) return <ErrorBlock title={error.message} />

  const data = ctx.spy(rolesList.fetch.dataAtom)
  if (!data) return null;

  return data.map((role) => <RolesListItem key={role.id} {...role} />)
}, "RolesList")

const RolesListItemNewPerms = reatomComponent(({ ctx }) => {
  const data = ctx.spy(roleNewPermsAtom);
  if (data.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 w-full h-fit">
      {data.map((p) => <RolesListItemNewPermsItem key={p.id} {...p} />)}
    </div>
  )
}, "RolesListItemNewPerms")

const RolesEditablePermHeader = reatomComponent(({ ctx }) => {
  return (
    <div className="flex gap-3 items-center">
      <Typography className="text-neutral-50 text-base">
        Разрешения
      </Typography>
      <div className="flex items-center gap-2 text-sm">
        <Typography>
          {"("}всего: {ctx.spy(permissionsByRole.fetchList.dataAtom)?.permissions.length ?? 0},&nbsp;
        </Typography>
        <Typography className="text-green-500">
          +: {ctx.spy(roleNewPermsAtom).length},&nbsp;
        </Typography>
        <Typography className="text-red">
          -: {ctx.spy(roleDeletedPermsAtom).length}{")"}
        </Typography>
        {ctx.spy(saveChangesIsValidAtom) && (
          <Typography className="text-[11px] font-semibold text-yellow-400">
            не сохранено
          </Typography>
        )}
      </div>
    </div>
  )
}, "RolesEditablePermHeader")

const RolesEditable = reatomComponent(({ ctx }) => {
  if (!ctx.spy(rolesIsEditableAtom)) return null;

  return (
    <div className="flex flex-col h-fit w-full gap-2">
      <div className="flex flex-col gap-2">
        <RolesEditablePermHeader />
        <div
          className={scrollableVariant({
            className: `flex flex-col gap-1 max-h-[200px] scrollbar-w-2 rounded-lg pr-1 overflow-y-auto`
          })}
        >
          <RolesListItemPerms />
          <RolesListItemNewPerms />
        </div>
      </div>
      <div className="flex justify-end items-center gap-2 w-full">
        <RolesListItemAddPerm />
      </div>
    </div>
  )
}, "RolesEditable")

export const Roles = () => {
  return (
    <div className="flex flex-col w-full gap-4 justify-between">
      <div className="flex flex-col gap-2 w-full grow">
        <RolesList />
      </div>
    </div>
  )
}
