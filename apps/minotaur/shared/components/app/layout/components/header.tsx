import { Icon } from "@/shared/ui/icon"
import { Link } from '@/shared/components/config/link/link';
import { reatomComponent } from "@reatom/npm-react";
import { cartDataSelectedItemsLengthAtom, cartState } from "../../shop/models/store-cart.state";
import { Logotype } from "./logotype";
import {
  createHeaderLinks, type HeaderLink, showAuthorizeButtonAtom, showCartIconAtom, showCurrentUserMenuAtom
} from "../models/navigation.model";
import { MobileBottomBar } from "./mobile-navigation";
import { appState, userState } from "@/shared/models/app/index.model";
import { Banner } from "../../widgets/components/banner";
import { translate } from "@/shared/locales/helpers";
import { action } from "@reatom/framework";
import { Portal } from "@ark-ui/react/portal";
import { getLocale, locales } from "@/paraglide/runtime";
import { LOCALES_MAP } from "@/shared/locales";
import { locale } from "@/shared/models/shared.model";
import { createListCollection, Select } from "@ark-ui/react/select";
import { SelectItemIndicator, selectVariant } from "@/shared/ui/select";
import { UserMenu } from "./header-menu";

const AuthorizeButton = () => {
  return (
    <Link
      href="/auth"
      aria-label={translate["shared.header.authorizeTitle"]()}
      className="flex items-center justify-center font-semibold text-sm h-9 min-w-10 px-4 py-2 bg-green-700 rounded-xl"
    >
      {translate["shared.header.authorizeTitle"]()}
    </Link>
  )
}

const syncCartTrigger = action((ctx) => (el: Nullable<HTMLAnchorElement>) => {
  if (!el) return;

  const sub = ctx.subscribe(cartState.isTriggered, (state) => {
    el.dataset.trigger = String(state)
  })

  return sub;
})

const CartTrigger = reatomComponent(({ ctx }) => {
  const showCartIcon = ctx.spy(showCartIconAtom)
  if (!showCartIcon) return null;

  const cartItemsLength = ctx.spy(cartDataSelectedItemsLengthAtom)
  const initial = ctx.get(cartState.isTriggered);

  return (
    <Link
      aria-label="Перейти в корзину"
      href="/store/cart"
      data-trigger={initial}
      className="
        flex items-center justify-center group duration-150 max-h-6 w-6 aspect-square
        data-[trigger=true]:scale-[1.15] font-semibold data-[trigger=false]:scale-100
      "
      ref={syncCartTrigger(ctx)}
    >
      <Icon
        name="sprite:building-store"
        className="size-[24px] group-data-[trigger=true]:text-green-500 group-data-[trigger=false]:text-neutral-400"
      />
      {cartItemsLength > 0 && (
        <div
          className="
            flex items-center justify-center absolute -bottom-1 -right-1
            bg-neutral-50 text-[12px] leading-none text-neutral-950 rounded-sm
            aspect-square min-w-4 w-4
          "
        >
          {cartItemsLength}
        </div>
      )}
    </Link>
  )
}, "CartTrigger")

const LangSwitcher = reatomComponent(({ ctx }) => {
  const isAuthed = ctx.spy(userState.isAuthed)
  if (isAuthed) return null;

  return (
    <Select.Root
      onValueChange={(details) => locale.change(ctx, details.value[0])}
      positioning={{
        placement: "bottom-end"
      }}
      multiple={false}
      value={[getLocale()]}
      collection={createListCollection({ items: locales })}
    >
      <Select.Trigger
        aria-label={translate["shared.change-lang.title"]()}
        title={translate["shared.change-lang.title"]()}
        className={selectVariant.trigger("bg-neutral-900 h-full px-3")}
      >
        <Icon name="sprite:language" className="size-5 text-neutral-400" />
      </Select.Trigger>
      <Portal>
        <Select.Positioner>
          <Select.Content className={selectVariant.content("min-w-[200px]" )}>
            <Select.ItemGroup className={selectVariant.itemGroup()}>
              {locales.map((locale) => (
                <Select.Item key={locale} item={locale} className={selectVariant.item("text-base")}>
                  <Select.ItemText className={selectVariant.itemText()}>
                    {LOCALES_MAP[locale]}
                  </Select.ItemText>
                  <SelectItemIndicator />
                </Select.Item>
              ))}
            </Select.ItemGroup>
          </Select.Content>
        </Select.Positioner>
      </Portal>
      <Select.HiddenSelect />
    </Select.Root>
  )
}, "LangSwitcher")

const UserTrigger = reatomComponent(({ ctx }) => (
  <>
    {ctx.spy(showCurrentUserMenuAtom) && <UserMenu />}
    {ctx.spy(showAuthorizeButtonAtom) && <AuthorizeButton />}
  </>
), "UserTrigger")

const LinkItem = ({ title, label, href }: HeaderLink) => {
  return (
    <Link
      aria-label={label}
      href={href}
      className="
        inline-flex justify-center items-center h-full px-8 border-b-2 hover:bg-neutral-800
        data-[state=inactive]:border-transparent data-[state=active]:border-green-500
        font-semibold text-sm truncate
      "
    >
      {title}
    </Link>
  )
}

export const Header = reatomComponent<{ asCompact?: boolean }>(({ ctx, asCompact = false }) => {
  return (
    <div className="flex flex-col w-full border-b rounded-b-xl border-neutral-800 relative z-20">
      <div className="flex items-center justify-start w-full h-20 max-h-20 top-0">
        <div className="flex items-center justify-between px-2 gap-2 sm:px-6 h-full w-full">
          <div className="w-1/5 bg-transparent h-14 relative">
            <Logotype />
          </div>
          {!ctx.spy(appState.current.isMobile) && (
            <div className="flex w-3/5 justify-center items-center h-full text-neutral-400">
              {createHeaderLinks().map((link, idx) => <LinkItem key={idx} {...link} />)}
            </div>
          )}
          <div className="w-full md:w-1/5">
            {asCompact ? <div /> : (
              <div className="flex gap-2 items-center w-full justify-end">
                <CartTrigger />
                <LangSwitcher />
                <UserTrigger />
              </div>
            )}
          </div>
        </div>
      </div>
      {!asCompact && <Banner />}
    </div>
  )
}, "Header")

export const Navigation = reatomComponent(({ ctx }) => (
  <>
    {ctx.spy(appState.current.isMobile) && <MobileBottomBar />}
    <Header />
  </>
), "Navigation")
