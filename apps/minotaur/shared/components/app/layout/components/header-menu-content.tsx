import { Separator } from "@/shared/ui/separator";
import { reatomComponent } from "@reatom/npm-react";
import {
  createMenuActions, validatedLinksAtom, type MenuLink, type MenuActionItem as MenuActionItemType
} from "../models/navigation.model";
import { menuVariant } from "@/shared/ui/menu";
import { Menu, type MenuItemProps } from "@ark-ui/react/menu";
import { Avatar } from "@/shared/ui/avatar";
import { Typography } from "@/shared/ui/typography";
import { navigate } from "vike/client/router";
import { currentUserState } from "@/shared/models/current-user/index.model";
import { clsx } from "cnfast";
import { createLink } from "@/shared/components/config/link/link.model";

const ITEM_VARIANT = ["menu", "drawer"] as const;;
type ItemVariant = typeof ITEM_VARIANT[number];

const MenuActionItem = reatomComponent<MenuActionItemType & { variant: ItemVariant }>(({
  ctx, label, cb, variant, disabled, className
}) => {
  const { Item, itemProps } = defineItem(variant, {
    onClick: () => cb(ctx),
    className: clsx("gap-2 w-full font-semibold text-base", className),
    disabled: disabled?.(ctx) ?? false,
    value: label
  })

  return <Item {...itemProps} data-sound={true}>{label}</Item>
}, "MenuActionItem")

const MenuCurrentUser = reatomComponent<{ variant: ItemVariant }>(({ ctx, variant }) => {
  const currentUser = ctx.spy(currentUserState);
  if (!currentUser) return null;

  const { Item, itemProps } = defineItem(variant, {
    className: "flex gap-2 items-center min-h-10 select-none cursor-pointer rounded-lg p-2 bg-neutral-800 w-full overflow-hidden",
    onClick: () => navigate(createLink("player", currentUser.nickname)),
    value: "current-user"
  })

  return (
    <Item {...itemProps}>
      <Avatar
        nickname={currentUser.nickname}
        url={currentUser.avatar}
        className="min-w-10 w-10"
      />
      <div className="flex flex-col justify-center items-start w-full h-10">
        <Typography className="text-sm text-neutral-50 font-semibold leading-4 truncate">
          {currentUser.nickname.slice(0, 32)}
        </Typography>
        <Typography className="text-neutral-400 leading-4 text-sm truncate">
          игрок
        </Typography>
      </div>
    </Item>
  )
}, "MenuCurrentUser")

function defineItem<T extends ItemVariant>(variant: T, props: MenuItemProps) {
  const Item = variant === 'drawer' ? "div" : Menu.Item
  return {
    Item,
    itemProps: { ...props, className: menuVariant.item(props?.className) }
  };
}

const MenuLinkItem = reatomComponent<MenuLink & { idx: number, variant: ItemVariant }>(({
  ctx, variant, type, title, idx, href
}) => {
  const data = ctx.spy(validatedLinksAtom)
  const firstPrivatedIdx = data.findIndex(link => link.type === 'privated')
  const lastPrivatedIdx = data.map(link => link.type).lastIndexOf('privated')
  const showSepartor = type === 'privated' && idx;

  const { Item, itemProps } = defineItem(variant, {
    className: "font-semibold text-base",
    onClick: () => navigate(href),
    value: href
  })

  return (
    <>
      {showSepartor === firstPrivatedIdx && <Separator className="my-2" />}
      <Item {...itemProps} data-sound={true}>{title}</Item>
      {showSepartor === lastPrivatedIdx && <Separator className="my-2" />}
    </>
  )
}, "MenuLinkItem")

export const UserMenuContent = reatomComponent<{ variant: ItemVariant }>(({ ctx, variant }) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      <MenuCurrentUser variant={variant} />
      <Separator className="my-2" />
      {ctx.spy(validatedLinksAtom).map((link, idx) => (
        <MenuLinkItem variant={variant} key={link.href} idx={idx} {...link} />)
      )}
      {createMenuActions().map((action, idx) => (
        <MenuActionItem variant={variant} key={idx} {...action} />
      ))}
    </div>
  )
}, "UserMenuContent")
