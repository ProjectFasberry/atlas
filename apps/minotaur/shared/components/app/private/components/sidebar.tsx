import { Link } from "@/shared/components/config/link/link"
import { tv } from "tailwind-variants"
import { getFromDictionary } from "@/shared/models/app/utils";
import { currentUserState } from "@/shared/models/current-user/index.model";
import { reatomComponent, useUpdate } from "@reatom/npm-react";
import { clsx } from "cnfast";
import { Typography } from "@/shared/ui/typography"
import { Icon } from "@/shared/ui/icon"
import { Button } from "@/shared/ui/button"
import { Dialog } from '@ark-ui/react/dialog'
import { Portal } from '@ark-ui/react/portal'
import { dialogVariant, DialogClose } from "@/shared/ui/dialog";
import { scrollableVariant } from "@/shared/consts/style-variants";
import { Avatar } from "@/shared/ui/avatar";
import { Noop } from "@/shared/ui/noop";
import {
  formatAccountDate, groupsAtom, sidebar, sidebarLinks, toggleSidebar,
  transformPermsByNamespace
} from "../models/sidebar.model";

const InfoCell = ({ label, value }: { label: string, value: string }) => (
  <div className="flex flex-col gap-0.5 rounded-lg border border-neutral-800 bg-neutral-800/40 px-3 py-1">
    <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</span>
    <span className="truncate text-sm font-semibold">{value}</span>
  </div>
)

const UserInfo = reatomComponent(({ ctx }) => {
  const open = ctx.spy(sidebar.infoIsOpened)
  const collapsed = ctx.spy(sidebar.isCollapsed)

  useUpdate(transformPermsByNamespace, []);

  const currentUser = ctx.spy(currentUserState);
  if (!currentUser) return null;

  const role = ctx.spy(currentUserState.role)
  if (!role) return null;

  const groups = ctx.spy(groupsAtom)
  const permissions = ctx.spy(currentUserState.perms)
  const roleTitle = getFromDictionary(ctx, role.name)
  const registeredAt = formatAccountDate(currentUser.meta.reg_date)

  return (
    <Dialog.Root
      open={open}
      onOpenChange={({ open: next }) => sidebar.infoIsOpened(ctx, next)}
    >
      <Dialog.Trigger
        className={clsx(
          `
            group flex w-full min-w-0 items-center justify-between
            gap-2 rounded-xl bg-neutral-800 px-2 py-0.5 text-left
            duration-150 hover:bg-neutral-700 sm:h-10 sm:px-3 sm:py-0
          `,
          collapsed && "lg:justify-center lg:px-0",
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <Avatar
            url={currentUser.avatar}
            nickname={currentUser.nickname}
            className="size-6 shrink-0 sm:size-7"
          />
          <Typography className={clsx("hidden max-w-24 truncate text-sm font-semibold sm:block", collapsed && "lg:hidden")}>
            {currentUser.nickname}
          </Typography>
          <span
            className={clsx(
              "truncate rounded-lg bg-green-500/15 px-1.5 py-0.5 text-[11px] font-semibold text-green-400",
              collapsed && "lg:hidden",
            )}
          >
            {roleTitle}
          </span>
        </div>
        <div className={clsx("flex shrink-0 items-center gap-1.5 text-neutral-400", collapsed && "lg:hidden")}>
          <span
            title="Всего прав"
            className="hidden rounded-lg bg-neutral-900
              px-1.5 py-0.5 text-[10px] font-semibold sm:inline-flex"
          >
            {permissions.length}
          </span>
          <Icon name="sprite:arrows-diagonal" className="size-3.5 sm:size-4" />
        </div>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop className={dialogVariant.backdrop()} />
        <Dialog.Positioner className={dialogVariant.positioner()}>
          <Dialog.Content className={dialogVariant.content("items-start! justify-start! max-h-[80vh] overflow-hidden")}>
            <div className="flex flex-col gap-1 pr-8">
              <Dialog.Title className={dialogVariant.title()}>
                Профиль и права
              </Dialog.Title>
              <Typography color="gray" className="text-sm">
                Роль определяет доступные разделы приватной панели.
              </Typography>
            </div>
            <div
              className="
                flex w-full flex-col gap-3 rounded-xl
                border border-neutral-800 bg-neutral-800/40 p-3 sm:flex-row sm:items-center
              "
            >
              <Avatar
                url={currentUser.avatar}
                nickname={currentUser.nickname}
                className="size-12 shrink-0"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Typography className="truncate text-lg font-semibold">
                    {currentUser.nickname}
                  </Typography>
                  <span className="rounded-lg bg-green-500/15 px-2 py-0.5 text-[11px]
                    font-semibold text-green-400">
                    {roleTitle}
                  </span>
                </div>
                <Typography color="gray" className="truncate text-xs">
                  UUID: {currentUser.uuid}
                </Typography>
              </div>
            </div>
            <div className="grid w-full gap-2 sm:grid-cols-3">
              <InfoCell label="Права" value={permissions.length.toString()} />
              <InfoCell label="Группы" value={groups.length.toString()} />
              <InfoCell label="Регистрация" value={registeredAt} />
            </div>
            <div
              className={scrollableVariant({
                className: "flex min-h-0 w-full flex-1 flex-col gap-2 overflow-y-auto pr-1"
              })}
            >
              {groups.length === 0
                ? <Noop title="Права не назначены" />
                : (
                  <div className="grid w-full gap-2 sm:grid-cols-2">
                    {groups.map((group) => (
                      <div
                        key={group.title}
                        className="flex flex-col gap-1.5 rounded-xl border border-neutral-800 p-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <Typography className="text-sm font-semibold">
                            {group.title}
                          </Typography>
                          <span className="rounded-lg bg-neutral-800 px-1.5 py-0.5
                            text-[11px] font-medium text-neutral-400">
                            {group.data.length}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          {group.data.map((item) => (
                            <div
                              key={item}
                              className="flex items-center gap-1.5 rounded-lg bg-neutral-800/60 px-2 py-1"
                            >
                              <Icon name="sprite:check" className="size-3 shrink-0 text-green-500" />
                              <span
                                className="truncate font-mono text-[11px] text-neutral-300"
                                title={item}
                              >
                                {item}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
            <DialogClose />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}, "Info")

const linkVariant = tv({
  base: `
    flex justify-start items-center gap-2 group h-6 sm:h-10 rounded-xl px-2 sm:px-4
    data-[state=inactive]:bg-neutral-800 data-[state=inactive]:text-neutral-50
    data-[state=active]:bg-neutral-50 data-[state=active]:text-neutral-950
  `,
  variants: {
    collapsed: {
      true: "lg:justify-center lg:px-0 lg:size-10 lg:shrink-0",
      false: ""
    }
  },
  defaultVariants: {
    collapsed: false
  },
  slots: {
    text: "font-semibold text-nowrap text-sm",
    icon: "size-4 shrink-0"
  }
})

const SidebarHeader = reatomComponent(({ ctx }) => {
  const collapsed = ctx.spy(sidebar.isCollapsed)

  return (
    <div className="flex flex-col gap-1 w-full">
      <span className={clsx("hidden lg:inline", collapsed && "lg:hidden")}>Инфо</span>
      <UserInfo />
    </div>
  )
}, "SidebarHeader")

const SidebarBody = reatomComponent(({ ctx }) => {
  const permissions = ctx.spy(currentUserState.perms)
  const collapsed = ctx.spy(sidebar.isCollapsed)
  const visible = sidebarLinks.filter((link) => permissions.includes(link.permission))

  return (
    <div className="flex flex-row items-center lg:items-stretch lg:flex-col gap-1 w-full">
      <span className={clsx("hidden lg:inline", collapsed && "lg:hidden")}>Навигация</span>
      {visible.map((link) => (
        <Link
          key={link.title}
          href={link.value}
          title={collapsed ? link.title : undefined}
          className={linkVariant({ collapsed }).base()}
        >
          <Icon name={link.icon} className={linkVariant({ collapsed }).icon()} />
          <Typography className={clsx(linkVariant({ collapsed }).text(), collapsed && "lg:hidden")}>
            {link.title}
          </Typography>
        </Link>
      ))}
    </div>
  )
}, "SidebarBody")

const SidebarToggle = reatomComponent(({ ctx }) => {
  const collapsed = ctx.spy(sidebar.isCollapsed)

  return (
    <Button
      background="default"
      title={collapsed ? "Развернуть" : "Свернуть"}
      className={clsx(
        "hidden lg:flex h-8 shrink-0 items-center gap-2 rounded-xl px-3 text-neutral-400",
        collapsed && "lg:justify-center lg:px-0",
      )}
      onClick={() => toggleSidebar(ctx)}
    >
      <Icon name={collapsed ? "sprite:arrow-right" : "sprite:arrow-left"} className="size-4 shrink-0" />
      <Typography className={clsx("text-xs font-semibold", collapsed && "lg:hidden")}>
        Свернуть
      </Typography>
    </Button>
  )
}, "SidebarToggle")

export const Sidebar = reatomComponent(({ ctx }) => {
  const collapsed = ctx.spy(sidebar.isCollapsed)

  return (
    <div
      className={scrollableVariant({
        className: clsx(
          `
            flex sm:h-fit sm:max-h-fit h-12 max-h-12 items-center sm:items-stretch
            sticky z-20 top-2 flex-row overflow-x-auto lg:flex-col
            border lg:border-transparent border-neutral-800 gap-2 lg:gap-4 w-full
            lg:shrink-0 p-2 lg:p-3 bg-neutral-900 rounded-xl scrollbar-h-2 overflow-y-hidden
          `,
          collapsed ? "lg:w-16" : "lg:w-1/4",
        )
      })}
    >
      <SidebarHeader />
      <SidebarBody />
      <div className="hidden lg:flex lg:mt-auto lg:w-full">
        <SidebarToggle />
      </div>
    </div>
  )
}, "Sidebar")
