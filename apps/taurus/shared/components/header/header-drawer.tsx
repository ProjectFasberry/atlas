import { pageState } from "@/shared/models/page.model";
import { getStaticObject } from "@/shared/lib/helpers";
import { layoutSettings } from "../settings/settings.model";
import { getLocale, setLocale, type Locale } from "@/paraglide/runtime";
import { env } from "@/shared/env";
import { translate } from "@/shared/locales/helpers";
import { tv } from "tailwind-variants";
import { For, Show } from "solid-js";
import { Accordion } from "@ark-ui/solid/accordion";
import { Typography } from "@/shared/ui/typography";
import { expImage, createMainHeaderLinks, headerDrawerState } from "./header.model";
import { accordionVariant } from "../../ui/accordion";
import { useAtomAccessor } from "@/shared/lib/utils";
import { reatomComponent } from "@/shared/lib/reatom";

const ExperienceCircle = () => {
  return (
    <img
      src={expImage}
      loading="lazy"
      width={16}
      height={16}
      alt=""
      draggable={false}
    />
  )
}

const itemVariant = tv({
  base: `flex border-2 border-neutral-600 hover:bg-neutral-600 group bg-neutral-800 rounded-md gap-6 py-2 px-2 w-full`
})

const compassImage = getStaticObject("minecraft", "items/compass.webp")
const LANGUAGES = ["ru", "en"] as const

export const HeaderDrawerContent = reatomComponent(({ ctx }) => {
  const urlParsed = useAtomAccessor(pageState.urlParsed)
  const pathname = () => urlParsed()?.pathname;

  const handleToPage = (href?: string) => {
    if (!href) return;

    // Internal links close through the path effect in `HeaderDrawer`: closing
    // here unmounts the anchor before Vike follows the click, so the page never
    // changes. External links leave the SPA, so they close right away.
    if (!href.startsWith("/") || href === pathname()) {
      headerDrawerState.isOpen(ctx, false);
    }
  };

  const openSettings = () => {
    headerDrawerState.isOpen(ctx, false)
    layoutSettings.open(ctx)
  }

  const changeLocale = (locale: Locale) => {
    setLocale(locale)
    headerDrawerState.isOpen(ctx, false)
  }

  return (
    <div class="flex flex-col items-center justify-center w-full gap-2">
      <For each={createMainHeaderLinks()}>
        {(item) => (
          <Show
            when={item.childs}
            fallback={
              <Show when={item.href}>
                {(href) => (
                  <a
                    href={href()}
                    onClick={() => handleToPage(href())}
                    class={itemVariant()}
                  >
                    <div class="flex items-center gap-1">
                      <Show when={href() === pathname()}>
                        <ExperienceCircle />
                      </Show>
                      <Typography>{item.name}</Typography>
                    </div>
                  </a>
                )}
              </Show>
            }
          >
            {(data) => (
              <Accordion.Root
                multiple={false}
                collapsible
                class={accordionVariant.root()}
              >
                <Accordion.Item value={item.name} class={accordionVariant.item()}>
                  <Accordion.ItemTrigger
                    class={accordionVariant.itemTrigger({ class: itemVariant() })}
                  >
                    <Show when={item.href === pathname()}>
                      <ExperienceCircle />
                    </Show>
                    <Typography>{item.name}</Typography>
                  </Accordion.ItemTrigger>
                  <Accordion.ItemContent class={accordionVariant.itemContent({ class: "flex gap-1 pt-1" })}>
                    <div class="w-0.5 mt-1 bg-neutral-700" />
                    <div class="flex flex-col gap-2 w-full">
                      <For each={data()}>
                        {(item) => (
                          <a
                            href={item.href}
                            onClick={() => handleToPage(item.href)}
                            class={itemVariant()}
                          >
                            <div class="flex items-center gap-1">
                              <Show when={item.href === pathname()}>
                                <ExperienceCircle />
                              </Show>
                              <Typography>{item.name}</Typography>
                            </div>
                          </a>
                        )}
                      </For>
                    </div>
                  </Accordion.ItemContent>
                </Accordion.Item>
              </Accordion.Root>
            )}
          </Show>
        )}
      </For>
      <a
        href={env.VITE_APP_URL}
        onClick={() => handleToPage(env.VITE_APP_URL)}
        class={itemVariant()}
      >
        <Typography>{translate["header.links.account"]()}</Typography>
      </a>
      <div
        class="mt-2 flex w-full items-center justify-between gap-4 border-2
          border-neutral-600 bg-neutral-800 px-2 py-2"
      >
        <Typography>{translate["languages.title"]()}</Typography>
        <div class="flex gap-1">
          <For each={LANGUAGES}>
            {(code) => (
              <button
                type="button"
                aria-pressed={getLocale() === code}
                class={`raised-slot cursor-pointer px-2 py-0.5 text-sm uppercase
                  ${getLocale() === code ? "font-semibold text-neutral-950" : "text-neutral-700"}`}
                onClick={() => changeLocale(code)}
              >
                {code}
              </button>
            )}
          </For>
        </div>
      </div>
      <button type="button" class={itemVariant()} onClick={openSettings}>
        <div class="flex items-center gap-2">
          <img src={compassImage} alt="" width={24} height={24} class="size-6" />
          <Typography>{translate["settings.title"]()}</Typography>
        </div>
      </button>
    </div>
  )
}, "HeaderDrawerContent")