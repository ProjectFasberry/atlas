import { appState } from "@/shared/models/app/index.model";
import { Vaul, VaulContent, VaulTrigger } from "@/shared/ui/vaul";
import { Menu } from "@ark-ui/react/menu";
import { reatomComponent } from "@reatom/npm-react";
import { headerUserMenuIsOpenAtom } from "../models/navigation.model";
import { menuVariant } from "@/shared/ui/menu";
import { Icon, type IconName } from "@/shared/ui/icon";
import { action } from "@reatom/framework";
import { currentUserState } from "@/shared/models/current-user/index.model";
import { createLink } from "@/shared/components/config/link/link.model";
import { Link } from "@/shared/components/config/link/link";
import { Avatar } from "@/shared/ui/avatar";
import { lazy, Suspense } from "react";

const UserMenuContent = lazy(() => import("./header-menu-content").then(m => ({ default: m.UserMenuContent })))

const UserCurrentTrigger = reatomComponent(({ ctx }) => {
  const currentUser = ctx.spy(currentUserState);
  if (!currentUser) return null;

  return (
    <Link
      href={createLink("player", currentUser.nickname)}
      className="flex items-center gap-2 h-8 overflow-hidden"
    >
      <Avatar
        nickname={currentUser.nickname} url={currentUser.avatar} className="min-w-8 w-8"
      />
    </Link>
  )
}, "UserCurrentTrigger")

const syncState = action((ctx) => (el: Nullable<HTMLDivElement>) => {
  if (!el) return;

  const sub = ctx.subscribe(headerUserMenuIsOpenAtom, (state) => {
    el.dataset.active = String(state)
  });

  return sub;
})

const USER_MENU_TRIGGER_ICONS: { icon: IconName, value: boolean }[] = [
  { icon: "sprite:x", value: true }, { icon: "sprite:menu-2", value: false }
];

const UserMenuTrigger = reatomComponent(({ ctx }) => {
  const initial = ctx.get(headerUserMenuIsOpenAtom);

  return (
    <div
      data-active={initial}
      className="
        flex items-center justify-center group hover:bg-neutral-800
        bg-neutral-900 text-neutral-400 rounded-lg cursor-pointer h-8 w-8
      "
      ref={syncState(ctx)}
    >
      {USER_MENU_TRIGGER_ICONS.map(({ icon: iconName, value }, idx) => (
        <Icon
          name={iconName}
          key={idx}
          data-sound={true}
          className={`size-5 absolute duration-300 opacity-0 ${value
            ? "group-data-[active=true]:opacity-100" : "group-data-[active=false]:opacity-100"
            }`}
        />
      ))}
    </div>
  )
}, "UserMenuTrigger")

const UserMenuVaul = () => {
  return (
    <Vaul openAtom={headerUserMenuIsOpenAtom}>
      <VaulTrigger>
        <UserMenuTrigger />
      </VaulTrigger>
      <VaulContent>
        <Suspense>
          <UserMenuContent variant="drawer" />
        </Suspense>
      </VaulContent>
    </Vaul>
  )
}

const UserMenuDropdown = reatomComponent(({ ctx }) => {
  return (
    <Menu.Root
      open={ctx.spy(headerUserMenuIsOpenAtom)}
      positioning={{ placement: "bottom-end" }}
      onOpenChange={(details) => headerUserMenuIsOpenAtom(ctx, details.open)}
    >
      <Menu.Trigger className={menuVariant.trigger()}>
        <UserMenuTrigger />
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content className={menuVariant.content("min-w-[240px]")}>
          <Menu.Arrow className={menuVariant.arrow()}>
            <Menu.ArrowTip className={menuVariant.arrowTip()} />
          </Menu.Arrow>
          <Suspense>
            <UserMenuContent variant="menu" />
          </Suspense>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  )
}, "UserMenuDropdown");

export const UserMenu = reatomComponent(({ ctx }) => {
  return (
    <div className="flex items-center w-fit gap-2 max-h-10 overflow-hidden min-w-0 h-10 px-2">
      <UserCurrentTrigger />
      {ctx.spy(appState.current.isMobile) ? <UserMenuVaul /> : <UserMenuDropdown />}
    </div>
  )
}, "UserMenu")
