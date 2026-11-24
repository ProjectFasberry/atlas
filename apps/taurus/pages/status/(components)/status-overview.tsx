import { Show } from "solid-js"
import { Typography, typographyVariants } from "@/shared/ui/typography"
import { Skeleton } from "@/shared/ui/skeleton"
import { tv } from "tailwind-variants"
import { serverStatus } from "../(models)/server-status.model"
import { getStaticObject } from "@/shared/lib/helpers"
import { translate } from "@/shared/locales/helpers"
import { useAtomAccessor } from "@/shared/lib/utils"

const serverTitle = tv({
  extend: typographyVariants,
  base: `text-md sm:text-base md:text-lg lg:text-xl`
})

const descTitle = tv({
  extend: typographyVariants,
  base: `text-md sm:text-base text-neutral-400 truncate md:text-lg lg:text-xl`
})

const SERVERS = [
  { id: "bisquite", label: "Bisquite", icon: "netherite_sword.webp" },
  { id: "muffin", label: "Muffin", icon: "wild_armor_trim_ыmithing_еemplate.webp" },
] as const

/** Headline card: per-server online counts and the proxy total. */
export const StatusOverview = () => {
  const status = useAtomAccessor(serverStatus.fetch.dataAtom)
  const statuses = useAtomAccessor(serverStatus.fetch.statusesAtom)

  const online = (id: string) => status()?.servers?.[id]?.online

  return (
    <div class="card-wrapper flex flex-col h-fit gap-4">
      <Typography class="text-xl lg:text-2xl">
        {translate["pages.status.overview.title"]()}
      </Typography>
      <div class="flex flex-col items-start gap-4">
        <div class="flex flex-col gap-2 w-full">
          {SERVERS.map((server) => (
            <div class="grid grid-cols-[1fr_1fr] grid-rows-1 w-full bg-neutral-800 p-2 rounded-lg">
              <div class="flex items-center gap-3">
                <div class="hidden sm:flex items-center justify-center bg-neutral-700/40 rounded-lg p-2">
                  <img
                    src={getStaticObject("minecraft", `items/${server.icon}`)}
                    alt=""
                    width={24}
                    draggable={false}
                    height={24}
                  />
                </div>
                <Typography class={serverTitle()}>{server.label}</Typography>
              </div>
              <div class="flex items-center w-full justify-end gap-3">
                <Typography color="gray" class={descTitle()}>
                  {translate["pages.status.overview.players"]({ count: online(server.id) ?? 0 })}
                </Typography>
              </div>
            </div>
          ))}
        </div>
        <div class="flex items-center justify-between w-full">
          <Show
            when={!statuses().isPending}
            fallback={
              <div class="flex items-center gap-2">
                <Typography class={descTitle({ className: "text-right" })}>
                  {translate["pages.status.overview.total-label"]()}
                </Typography>
                <Skeleton class="h-8 w-8" />
              </div>
            }
          >
            <Show when={status()}>
              {(data) => (
                <Typography class={descTitle({ className: "text-right" })}>
                  {translate["pages.status.overview.total"]({ count: data().proxy.online ?? 0 })}
                </Typography>
              )}
            </Show>
          </Show>
        </div>
      </div>
    </div>
  )
}
