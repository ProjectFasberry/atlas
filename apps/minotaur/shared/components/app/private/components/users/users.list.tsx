import { reatomComponent, useUpdate } from "@reatom/npm-react";
import {
  isCheckedAtom, type PrivatedUser, users, usersListInView, usersRestrict,
  usersRestrictState, usersState, usersDataArrAtom, usersRoles, usersAuth
} from "../../models/users.model";
import { Skeleton } from "@/shared/ui/skeleton";
import { currentUser } from "@/shared/models/current-user/index.model";
import { Link } from "@/shared/components/config/link/link";
import { Avatar } from "../../../../../ui/avatar";
import { Typography } from "@/shared/ui/typography"
import { UserActionsWrapper } from "./users.restrict";
import { checkboxVariant } from "@/shared/ui/checkbox";
import { Menu, type UseMenuContext } from '@ark-ui/react/menu'
import { menuVariant } from "@/shared/ui/menu";
import { Portal } from "@ark-ui/react/portal";
import { atom, type Ctx, spawn } from "@reatom/framework";
import { isEmptyArray } from "@/shared/lib/utils";
import { Noop } from "@/shared/ui/noop";
import { Checkbox } from "@ark-ui/react/checkbox";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { getFromDictionary } from "@/shared/models/app/utils";
import { translate } from "@/shared/locales/helpers"

/**
 * The list keeps a single Ark menu for every row: a menu per card would mount a
 * root, positioner and content for each user, and the list is long. The open
 * menu is anchored to a point in the viewport, so it follows the click even
 * after the list is scrolled.
 */
const menuPointAtom = atom({ x: 0, y: 0 }, "users.menuPoint");

const openUserMenu = (ctx: Ctx, nickname: string, point: { x: number; y: number }) => {
  usersRestrictState.targetRoleId.reset(ctx);
  usersRestrictState.selectedUser(ctx, nickname);
  menuPointAtom(ctx, point);
};

const bottomLeft = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  return { x: rect.left, y: rect.bottom };
};

const UserMenuRoles = reatomComponent<{ nickname: string; currentRoleId: number }>(({ ctx, nickname, currentRoleId }) => {
  const roles = ctx.spy(usersRoles.fetch.dataAtom);
  const pending = ctx.spy(usersRoles.submit.statusesAtom).isPending;

  if (!roles) return null;

  return (
    <>
      <Typography className="px-2 pt-1 text-[10px] uppercase tracking-wide text-neutral-500">
        {translate["panel.role"]()}</Typography>
      {roles.map((role) => (
        <Menu.Item
          key={role.id}
          value={`role-${role.id}`}
          disabled={pending || role.id === currentRoleId}
          className={menuVariant.item()}
          onClick={() => {
            // The menu closes on select and unmounts; spawn keeps the request alive.
            spawn(ctx, (spawnCtx) => {
              usersRestrictState.targetRoleId(spawnCtx, role.id);
              usersRoles.before(spawnCtx, [nickname], { type: "change_role" });
            });
          }}
        >
          <span className="flex w-full items-center justify-between gap-2">
            {getFromDictionary(ctx, role.name)}
            {role.id === currentRoleId ? <Icon name="sprite:check" className="size-3.5 text-green-400" /> : null}
          </span>
        </Menu.Item>
      ))}
    </>
  );
}, "UserMenuRoles");

const anchorRect = (point: { x: number; y: number }) => ({
  x: point.x,
  y: point.y,
  width: 0,
  height: 0,
});

/**
 * The menu body lives under `Menu.Context` because Zag ignores an `anchorPoint`
 * prop: the anchor is only known through `reposition`/`getAnchorRect`.
 */
const UsersItemMenuBody = reatomComponent<{
  menu: UseMenuContext;
  open: boolean;
  point: { x: number; y: number };
  nickname: string | null;
  roleId?: number;
}>(({ ctx, menu, open, point, nickname, roleId }) => {
  useUpdate(
    (_ctx, isOpen, currentPoint) => {
      if (!isOpen) return;

      menu.reposition({
        placement: "bottom-start",
        getAnchorRect: () => anchorRect(currentPoint),
      });
    },
    [open, point],
  );

  return (
    <Portal>
      <Menu.Positioner>
        <Menu.Content className={menuVariant.content("min-w-52")}>
          <div className="flex flex-col gap-0.5 p-1">
            {nickname ? (
              <Typography className="truncate px-2 py-1 text-xs text-neutral-400">
                {nickname}
              </Typography>
            ) : null}
            {nickname && roleId ? <UserMenuRoles nickname={nickname} currentRoleId={roleId} /> : null}
            {nickname ? <div className="my-1 h-px bg-neutral-800" /> : null}
            {nickname ? <UserActionsWrapper nickname={nickname} type="single" /> : null}
            {nickname ? <div className="my-1 h-px bg-neutral-800" /> : null}
            {nickname ? (
              <Menu.Item
                value="delete-user"
                className={`${menuVariant.item()} text-red`}
                onClick={() => usersAuth.requestDelete(ctx, nickname)}
              >
                {translate["panel.delete-the-user"]()}</Menu.Item>
            ) : null}
          </div>
        </Menu.Content>
      </Menu.Positioner>
    </Portal>
  );
}, "UsersItemMenuBody");

export const UsersItemMenu = reatomComponent(({ ctx }) => {
  const nickname = ctx.spy(usersRestrictState.selectedUser);
  const point = ctx.spy(menuPointAtom);
  const roleId = ctx.spy(usersDataArrAtom)?.find((user) => user.nickname === nickname)?.role?.id;
  const open = !!nickname;

  return (
    <Menu.Root
      open={open}
      positioning={{
        strategy: "fixed",
        placement: "bottom-start",
        getAnchorRect: () => anchorRect(point),
      }}
      aria-label={translate["panel.user-actions"]()}
      onOpenChange={({ open: next }) => {
        if (!next) usersRestrictState.selectedUser.reset(ctx);
      }}
    >
      <Menu.Context>
        {(menu) => (
          <UsersItemMenuBody
            menu={menu}
            open={open}
            point={point}
            nickname={nickname}
            roleId={roleId}
          />
        )}
      </Menu.Context>
    </Menu.Root>
  );
}, "UsersItemMenu");

const UsersItemCheckbox = reatomComponent<{ nickname: string }>(({ ctx, nickname }) => {
  return (
    <Checkbox.Root
      checked={ctx.spy(isCheckedAtom(nickname))}
      onCheckedChange={(details) => usersRestrict.select.single(ctx, details.checked, nickname)}
      className={checkboxVariant.root()}
    >
      <Checkbox.Control className={checkboxVariant.control()} />
      <Checkbox.HiddenInput />
    </Checkbox.Root>
  )
}, 'UsersItemCheckbox')

const UsersItem = reatomComponent<PrivatedUser>(({ ctx, avatar, nickname, role }) => {
  const isSelected = ctx.spy(isCheckedAtom(nickname));
  const isIdentity = currentUser.getNickname(ctx) === nickname;

  return (
    <div
      onContextMenu={(event) => {
        event.preventDefault();
        openUserMenu(ctx, nickname, { x: event.clientX, y: event.clientY });
      }}
      className={`group flex h-9 w-full items-center gap-2 rounded-lg border px-2 transition-colors ${
        isSelected
          ? "border-green-500/50 bg-neutral-800/60"
          : "border-transparent hover:bg-neutral-800/40"
      }`}
    >
      <UsersItemCheckbox nickname={nickname} />
      <Link href={`/private/users/${nickname}`} className="flex min-w-0 items-center gap-2">
        <Avatar url={avatar} nickname={nickname} className="size-6" />
        <Typography className="truncate text-sm font-semibold">
          {nickname}
        </Typography>
        {isIdentity ? (
          <span className="rounded bg-green-500/15 px-1 text-[10px] text-green-300">{translate["panel.you"]()}</span>
        ) : null}
      </Link>
      {role ? (
        <button
          type="button"
          onClick={(event) => openUserMenu(ctx, nickname, bottomLeft(event.currentTarget))}
          className="ms-auto max-w-36 truncate rounded-md border border-neutral-700 px-1.5 py-0.5 text-[11px] text-neutral-300 hover:border-neutral-500 hover:text-neutral-100"
        >
          {getFromDictionary(ctx, role.name)}
        </button>
      ) : null}
      <button
        type="button"
        aria-label={translate["panel.user-actions"]()}
        onClick={(event) => openUserMenu(ctx, nickname, bottomLeft(event.currentTarget))}
        className={`${role ? "" : "ms-auto"} flex size-6 shrink-0 items-center justify-center rounded text-neutral-500 opacity-0 hover:bg-neutral-700 hover:text-neutral-100 focus-visible:opacity-100 group-hover:opacity-100`}
      >
        <Icon name="sprite:dots-vertical" className="size-4" />
      </button>
    </div>
  )
}, "UsersItem")

const UsersSkeleton = ({ length = 32 }: { length?: number }) => {
  return (
    <div className="flex flex-col gap-1 w-full h-full">
      {Array.from({ length }).map((_, idx) => <Skeleton key={idx} className="h-9 w-full" />)}
    </div>
  )
}

const UsersUpdatingSkeleton = reatomComponent(({ ctx }) =>
  ctx.spy(users.update.statusesAtom).isPending && <UsersSkeleton length={3} />
)


/**
 * Loads the next page while the sentinel is in view.
 *
 * The previous `inView.onChange` only fired when the sentinel crossed the
 * viewport edge: a page shorter than the viewport (or a browser that keeps the
 * sentinel visible) stalled the list. The effect watches the cursor instead, so
 * it keeps loading until the viewport is filled or the feed is exhausted.
 */
export const UsersAutoLoad = reatomComponent(({ ctx }) => {
  const inView = ctx.spy(usersListInView);
  const meta = ctx.spy(usersState.meta);
  const pending = ctx.spy(users.update.statusesAtom).isPending;
  const error = ctx.spy(users.update.errorAtom);

  useUpdate((ctx) => {
    if (!inView || !meta?.hasNextPage || pending || error) return;

    spawn(ctx, (spawnCtx) => users.update(spawnCtx));
  }, [inView, meta?.hasNextPage, meta?.endCursor, pending, error]);

  return null;
}, "UsersAutoLoad")

export const UsersLoadMoreError = reatomComponent(({ ctx }) => {
  const error = ctx.spy(users.update.errorAtom);
  if (!error) return null;

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-red/40 px-3 py-2">
      <Typography className="text-sm text-red">{error.message}</Typography>
      <Button
        size="small"
        background="default"
        onClick={() => {
          users.update.errorAtom.reset(ctx);
          users.update(ctx);
        }}
      >
        {translate["panel.retry"]()}</Button>
    </div>
  );
}, "UsersLoadMoreError")

export const Users = reatomComponent(({ ctx }) => {
  if (ctx.spy(users.fetch.statusesAtom).isPending) return <UsersSkeleton />

  const data = ctx.spy(usersDataArrAtom);
  if (!data || isEmptyArray(data)) return <Noop title={translate["panel.empty"]()} />

  return (
    <div className="flex flex-col gap-1 w-full h-full">
      {data.map((user) => <UsersItem key={user.uuid} {...user} />)}
      <UsersUpdatingSkeleton />
    </div>
  )
}, "Users")
