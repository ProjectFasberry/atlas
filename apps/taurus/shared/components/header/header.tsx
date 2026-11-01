import { Link } from "@/shared/components/link";
import { toast } from 'solid-sonner';
import { Menu } from '@ark-ui/solid/menu'
import { Typography } from "@/shared/ui/typography";
import { useAtom } from "@reatom/npm-solid-js";
import { For, lazy, Show } from "solid-js";
import { pageState } from "@/shared/models/page.model";
import { Drawer, DrawerContent, DrawerTrigger } from "@/shared/ui/drawer";
import { getStaticObject } from "@/shared/lib/helpers";
import { ClientOnly } from "vike-solid/ClientOnly";
import { expImage, logoImage, createMainHeaderLinks, headerDrawerState, type MainHeaderLink } from "./header.model";
import { tv } from "tailwind-variants";
import { menuVariant } from "../../ui/menu";
import { cn } from "../../lib/utils";

const bellImg = getStaticObject("minecraft/icons", "bell.webp");
const bgImage = getStaticObject("minecraft/static", "cracked_polished_blacked.webp")

const HeaderDrawerContent = lazy(() => import("./header-drawer").then(m => ({ default: m.HeaderDrawerContent })))

const HeaderDrawer = () => {
  const [isOpenAtom, setIsOpenAtom] = useAtom(headerDrawerState.isOpen)

  const chestStatusImage = isOpenAtom()
    ? getStaticObject("minecraft/icons", "chest_opened.webp")
    : getStaticObject("minecraft/icons", "chest_closed.webp")

  return (
    <Drawer
      open={isOpenAtom()}
      onOpenChange={(open) => setIsOpenAtom(open)}
      modal
    >
      <DrawerTrigger
        aria-label={isOpenAtom() ? "Открыто" : "Закрыто"}
        class="xl:hidden absolute top-[10px] right-[8px] z-[3000]"
      >
        <img src={chestStatusImage} alt="" width={48} height={48} />
      </DrawerTrigger>
      <DrawerContent class="xl:hidden flex flex-col items-start justify-between w-full">
        <ClientOnly>
          <HeaderDrawerContent />
        </ClientOnly>
      </DrawerContent>
    </Drawer>
  );
}

const anchorVariant = tv({
  base: `
    relative duration-150 ease-in
    group-data-[state=closed]:rotate-180 group-data-[state=closed]:-top-1
    group-data-[state=open]:rotate-0 group-data-[state=open]:top-1
  `
})

const headerItemVariant = tv({
  base: `flex items-center gap-1 text-neutral-200`,
  slots: {
    label: `text-sm`
  }
})

const HeaderItemMenu = (props: MainHeaderLink) => {
  const [urlParsedAtom] = useAtom(pageState.urlParsed);

  const pathname = () => urlParsedAtom()?.pathname
  const isActive = () => pathname() === props.href;

  const handlePathDetect = (href: string) => {
    if (pathname() !== href) return;

    toast.info("Вы уже на этой странице", {
      icon: (
        <img
          alt=""
          loading="lazy"
          width={32}
          height={32}
          src={bellImg}
        />
      )
    })
  }

  return (
    <Show
      when={props.href}
      fallback={
        <Menu.Root>
          <Menu.Trigger class={menuVariant.trigger({ class: "group" })}>
            <div class={cn(headerItemVariant().base(), props.class)}>
              <Typography class={headerItemVariant().label()}>{props.name}</Typography>
              <Show when={props.childs}>
                <span class={anchorVariant()}>^</span>
              </Show>
            </div>
          </Menu.Trigger>
          <Menu.Positioner>
            <Menu.Content class={menuVariant.content({ class: "flex flex-col gap-2 w-full min-w-[200px]" })}>
              <Show when={props.childs}>
                {(childs) => (
                  <For each={childs()}>
                    {(child) => (
                      <Menu.Item value={child.name} class={headerItemVariant().base()}>
                        <Link href={child.href} class="tr">
                          <p class={headerItemVariant().label()}>{child.name}</p>
                        </Link>
                      </Menu.Item>
                    )}
                  </For>
                )}
              </Show>
            </Menu.Content>
          </Menu.Positioner>
        </Menu.Root>
      }
    >
      {(href) => (
        <Link
          href={href()}
          class={cn("flex items-center gap-1 text-neutral-200", props.class)}
          onClick={() => handlePathDetect(href())}
        >
          <Show when={isActive()}>
            <img
              src={expImage}
              width={20}
              alt=""
              height={20}
              draggable={false}
              loading="eager"
            />
          </Show>
          <Typography class={headerItemVariant().label()}>{props.name}</Typography>
          <Show when={props.childs}>
            <span class={anchorVariant()}>^</span>
          </Show>
        </Link>
      )}
    </Show>
  )
}

export const Header = () => {
  return (
    <div
      class={`header flex items-center justify-between absolute top-0 transition w-full bg-repeat-x z-50`}
      style={{ "background-size": '160px', "background-image": `url(${bgImage})` }}
    >
      <Link href="/" class="bg-transparent cursor-pointer relative md:-right-[40px] top-3 xl:-right-[60px]">
        <img src={logoImage} draggable={false} width={224} height={64} title="Fasberry" alt="Fasberry" />
      </Link>
      <div class="hidden xl:flex gap-8 items-center justify-start pr-[132px]">
        <For each={createMainHeaderLinks()}>
          {/* @ts-expect-error */}
          {(item) => <HeaderItemMenu {...item} />}
        </For>
      </div>
      <HeaderDrawer />
    </div>
  );
}
