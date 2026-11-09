import { reatomComponent, useUpdate } from "@reatom/npm-react";
import {
  isCheckedAtom, userIsSelectedAtom, type PrivatedUser, users, usersListInView, usersRestrict,
  usersRestrictState, usersState, usersDataArrAtom
} from "../../models/users.model";
import { Skeleton } from "@/shared/ui/skeleton";
import { tv } from "tailwind-variants";
import { currentUser } from "@/shared/models/current-user/index.model";
import { Link } from "@/shared/components/config/link/link";
import { Avatar } from "../../../../../ui/avatar";
import { Typography } from "@/shared/ui/typography"
import { UserActionsChangeRoleLocal } from "./users.change-role";
import { UserActionsWrapper } from "./users.restrict";
import { checkboxVariant } from "@/shared/ui/checkbox";
import { Menu } from '@ark-ui/react/menu'
import { menuVariant } from "@/shared/ui/menu";
import { Portal } from "@ark-ui/react/portal";
import { atom, spawn } from "@reatom/framework";
import { isEmptyArray } from "@/shared/lib/utils";
import { Noop } from "@/shared/ui/noop";
import { Checkbox } from "@ark-ui/react/checkbox";
import { Button } from "@/shared/ui/button";

const userItemVariant = tv({
  base: `flex flex-col rounded-lg w-full px-4 border`,
  variants: {
    variant: {
      default: "border-neutral-800",
      selected: "border-green-500/60",
    },
    state: {
      default: "",
      active: "bg-neutral-700"
    }
  },
  defaultVariants: {
    variant: "default"
  }
})

const coordsAtom = atom({ x: 0, y: 0 }, "coords");

usersRestrictState.selectedUser.onChange((ctx, state) => {
  const isOpen = !!state;

  if (isOpen) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "auto";
  }
})

export const UsersItemMenu = reatomComponent(({ ctx }) => {
  const nickname = ctx.spy(usersRestrictState.selectedUser);
  const coords = ctx.spy(coordsAtom);

  return (
    <Menu.Root
      open={!!nickname}
      onOpenChange={({ open }) => !open && usersRestrictState.selectedUser.reset(ctx)}
    >
      <Portal>
        {nickname && (
          <Menu.Positioner
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              transform: `translate3d(${coords.x}px, ${coords.y}px, 0)`,
              zIndex: 9999,
            }}
          >
            <Menu.Content className={menuVariant.content("min-w-40")}>
              <Menu.Arrow className={menuVariant.arrow()}>
                <Menu.ArrowTip className={menuVariant.arrowTip()} />
              </Menu.Arrow>
              <UserActionsWrapper nickname={nickname} type="single" />
            </Menu.Content>
          </Menu.Positioner>
        )}
      </Portal>
    </Menu.Root>
  )
}, "UsersItemMenu")

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

const UsersItem = reatomComponent<PrivatedUser>(({ ctx, player, role, avatar, nickname, uuid }) => {
  const isExpanded = ctx.spy(userIsSelectedAtom(nickname));
  const isIdentity = currentUser.getNickname(ctx) === nickname;

  const variant = isIdentity ? "selected" : "default"
  const state = isExpanded ? "active" : "default"

  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    usersRestrictState.selectedUser(ctx, nickname);
    coordsAtom(ctx, { x: e.clientX, y: e.clientY });
  };

  return (
    <div className={userItemVariant({ variant, state })} onContextMenu={handleContextMenu}>
      <div className="flex items-center gap-3 h-12 min-w-0 justify-start">
        <UsersItemCheckbox nickname={nickname} />
        <Link href={`/private/users/${nickname}`} className="flex items-center min-w-0 gap-2">
          <Avatar url={avatar} nickname={nickname} className="h-6 w-6" />
          <Typography className="font-semibold text-sm truncate">
            {nickname}
          </Typography>
        </Link>
        {role && (
          <UserActionsChangeRoleLocal nickname={nickname} role_id={role.id} role_name={role.name} />
        )}
      </div>
    </div>
  )
}, "UsersItem")

const UsersSkeleton = ({ length = 32 }: { length?: number }) => {
  return (
    <div className="flex flex-col gap-1 w-full h-full">
      {Array.from({ length }).map((_, idx) => <Skeleton key={idx} className="h-12 w-full" />)}
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
        Повторить
      </Button>
    </div>
  );
}, "UsersLoadMoreError")

export const Users = reatomComponent(({ ctx }) => {
  if (ctx.spy(users.fetch.statusesAtom).isPending) return <UsersSkeleton />

  const data = ctx.spy(usersDataArrAtom);
  if (!data || isEmptyArray(data)) return <Noop title="пусто" />

  return (
    <div className="flex flex-col gap-1 w-full h-full">
      {data.map((user) => <UsersItem key={user.uuid} {...user} />)}
      <UsersUpdatingSkeleton />
    </div>
  )
}, "Users")
