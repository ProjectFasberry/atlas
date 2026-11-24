import { For, Show } from "solid-js"
import { getStaticObject } from "@/shared/lib/helpers"
import { Typography } from "@/shared/ui/typography"
import { translate } from "@/shared/locales/helpers"
import { BlockControls, BlockSubtitle, BlockTitle, useBlockHidden } from "@/shared/components/edit/section-block"
import { ActionButton } from "./support-cards"

const steveImage = getStaticObject("support", "steve.webp")
const alexImage = getStaticObject("support", "alex.webp")

const whereItems = () => [
  {
    title: translate["support.where.items.hosting.title"](),
    description: translate["support.where.items.hosting.description"]()
  },
  {
    title: translate["support.where.items.development.title"](),
    description: translate["support.where.items.development.description"]()
  },
  {
    title: translate["support.where.items.content.title"](),
    description: translate["support.where.items.content.description"]()
  },
  {
    title: translate["support.where.items.events.title"](),
    description: translate["support.where.items.events.description"]()
  }
]

/** Where the money goes and who the donors are. */
export const SupportDetails = () => {
  const whereHidden = useBlockHidden("support-where")
  const thanksHidden = useBlockHidden("support-thanks")

  return (
    <div class="grid gap-3 lg:grid-cols-[1.1fr_.9fr]">
      <Show when={!whereHidden()}>
        <section class="transparent-achievement-panel flex flex-col gap-4 p-4 sm:p-5">
          <BlockTitle
            id="support-where"
            fallback={translate["support.where.title"]()}
            class="text-xl sm:text-2xl"
          />
          <BlockControls id="support-where" />
          <div class="flex flex-col gap-4">
            <For each={whereItems()}>
              {(item, index) => (
                <div class="flex items-start gap-3">
                  <span class="raised-slot flex h-8 w-8 shrink-0 items-center justify-center text-xs text-neutral-800">
                    {String(index() + 1).padStart(2, "0")}
                  </span>
                  <div class="flex min-w-0 flex-col gap-0.5">
                    <Typography color="white" class="text-sm sm:text-base">
                      {item.title}
                    </Typography>
                    <Typography color="gray" class="text-xs leading-5 sm:text-sm">
                      {item.description}
                    </Typography>
                  </div>
                </div>
              )}
            </For>
          </div>
        </section>
      </Show>
      <Show when={!thanksHidden()}>
        <section class="transparent-achievement-panel flex flex-col gap-4 p-4 sm:p-5">
          <BlockTitle
            id="support-thanks"
            fallback={translate["support.thanks.title"]()}
            class="text-xl sm:text-2xl"
          />
          <BlockControls id="support-thanks" />
          <div class="flex items-center gap-2">
            <img
              src={steveImage}
              alt=""
              width={96}
              height={96}
              loading="lazy"
              draggable={false}
              class="h-20 w-20 border border-neutral-700 bg-neutral-900 object-cover p-1"
            />
            <img
              src={alexImage}
              alt=""
              width={96}
              height={96}
              loading="lazy"
              draggable={false}
              class="h-20 w-20 border border-neutral-700 bg-neutral-900 object-cover p-1"
            />
            <Typography color="gray" class="text-xs leading-5">
              {translate["support.thanks.caption"]()}
            </Typography>
          </div>
          <BlockSubtitle
            id="support-thanks"
            fallback={translate["support.thanks.description"]()}
            class="text-sm leading-6"
          />
          <div class="mt-auto">
            <ActionButton href="/discord">
              {translate["support.thanks.action"]()}
            </ActionButton>
          </div>
        </section>
      </Show>
    </div>
  )
}
