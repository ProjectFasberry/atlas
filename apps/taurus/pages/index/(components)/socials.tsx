import { For, Show } from "solid-js"
import { Link } from "@/shared/components/link"
import { Typography } from "@/shared/ui/typography"
import { sectionVariant } from "@/shared/styles/variants"
import { getStaticObject } from "@/shared/lib/helpers"
import { translate } from "@/shared/locales/helpers"
import { BlockControls, BlockSubtitle, BlockTitle, useBlockHidden } from "@/shared/components/edit/section-block"

const socialsImage = getStaticObject("arts", "bzzvanet-newyork.webp")

const createSocialItems = () => [
  {
    name: "Discord",
    href: "/discord",
    description: translate["contacts.items.discord.description"](),
  },
  {
    name: "Telegram",
    href: "/telegram",
    description: translate["contacts.items.telegram.description"](),
  },
]

export const SocialsSection = () => {
  const hidden = useBlockHidden("share")

  return (
    <Show when={!hidden()}>
      <div id="share" class={sectionVariant()}>
        <div class="absolute top-0 right-0 left-0 overflow-hidden h-full">
          <img
            src={socialsImage}
            alt=""
            loading="lazy"
            class="w-full h-full object-cover object-center brightness-70"
          />
          <div class="absolute inset-0
          bg-[linear-gradient(180deg,rgba(13,13,13,.72)_0%,rgba(13,13,13,.35)_45%,rgba(13,13,13,.88)_100%)]"
          />
        </div>
        <div class="responsive z-1 flex flex-col gap-6 sm:gap-8">
          <div class="flex flex-col gap-1">
            <BlockTitle
              id="share"
              fallback={translate["contacts.title"]()}
              class="text-xl sm:text-3xl lg:text-4xl"
            />
            <BlockSubtitle
              id="share"
              fallback={translate["contacts.subtitle"]()}
              class="text-sm sm:text-base"
            />
            <BlockControls id="share" />
          </div>
          <div class="grid w-full gap-3 sm:grid-cols-2 lg:max-w-3xl">
            <For each={createSocialItems()}>
              {(item) => (
                <Link
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  class="group flex flex-col gap-3 transparent-achievement-panel bg-black/40 p-4
                  backdrop-blur-sm"
                >
                  <div class="flex items-start justify-between gap-4">
                    <Typography color="white" class="text-xl sm:text-2xl">
                      {item.name}
                    </Typography>
                    <span class="text-neutral-500 group-hover:text-green-400">
                      ↗
                    </span>
                  </div>
                  <Typography color="gray" class="text-sm leading-5 sm:text-base">
                    {item.description}
                  </Typography>
                  <span
                    class="button mt-auto inline-flex w-fit items-center px-4 py-2
                      text-sm font-semibold text-white"
                  >
                    {translate["contacts.item-title"]()} {item.name}
                  </span>
                </Link>
              )}
            </For>
          </div>
        </div>
      </div>
    </Show>
  )
}
