import { mergeProps, Show } from "solid-js"
import { Dialog } from "@ark-ui/solid/dialog"
import { Portal } from "solid-js/web"
import { Skeleton } from "@/shared/ui/skeleton"
import { Typography } from "@/shared/ui/typography"
import { Link } from "@/shared/components/link"
import { dialogVariant } from "@/shared/ui/dialog"
import { env } from "@/shared/env"
import { getStaticObject } from "@/shared/lib/helpers"
import { translate } from "@/shared/locales/helpers"
import { useAtomAccessor } from "@/shared/lib/utils"
import { type PlayerStatusProps, playerAvatars } from "../(models)/server-status.model"

const APP_URL = env.VITE_APP_URL
const FALLBACK_HEAD = getStaticObject("fallback", "steve_head.png")

type PlayerStatusImageProps = { type?: "small" | "full" } & PlayerStatusProps

const PlayerStatusImage = (props: PlayerStatusImageProps) => {
  const avatars = useAtomAccessor(playerAvatars)
  const merged = mergeProps({ type: "small" }, props);

  const size = () => merged.type === 'small'
    ? 'max-w-[36px] max-h-[36px]'
    : 'max-w-[164px] max-h-[164px]'

  const isLoading = () => !Object.hasOwn(avatars(), merged.nickname)

  return (
    <Show
      when={!isLoading()}
      fallback={
        <Skeleton class={`rounded-md ${size()}`} />
      }
    >
      <img
        height={800}
        width={800}
        class={`rounded-md ${size()}`}
        alt=""
        src={avatars()[merged.nickname] || FALLBACK_HEAD}
        onError={(event) => {
          event.currentTarget.onerror = null;
          event.currentTarget.src = FALLBACK_HEAD;
        }}
      />
    </Show>
  )
}

/** One online player; the dialog shows the full skin head and a profile link. */
export const PlayerStatus = (props: PlayerStatusProps) => {
  return (
    <Dialog.Root>
      <Dialog.Trigger class="w-full">
        <div
          class="
            flex items-center w-full px-4 py-3 rounded-xl duration-300
          hover:bg-neutral-700 bg-neutral-800 justify-start gap-4
          "
        >
          <PlayerStatusImage type="small" nickname={props.nickname} />
          <Typography color="white" class="text-xl">
            {props.nickname}
          </Typography>
        </div>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop class={dialogVariant.backdrop()} />
        <Dialog.Positioner>
          <Dialog.Content class="justify-center max-w-xl!">
            <Dialog.Title class={dialogVariant.title()}>{props.nickname}</Dialog.Title>
            <div class="flex flex-col items-center gap-8 w-full">
              <PlayerStatusImage type="full" nickname={props.nickname} />
              <div class="flex flex-col gap-2 w-full">
                <Link
                  href={`${APP_URL}/player/${props.nickname}`}
                  class="inline-flex items-center justify-center whitespace-nowrap
							px-4 py-2 hover:bg-[#05b458] duration-300 ease-in-out bg-[#088d47] rounded-md w-full"
                >
                  <p class="text-white text-lg">
                    {translate["pages.status.player.profile"]()}
                  </p>
                </Link>
                <Dialog.CloseTrigger class="w-full">
                  <div
                    class="inline-flex items-center justify-center whitespace-nowrap
								px-4 py-2 hover:bg-[#E66A6D] bg-[#C65558] rounded-md w-full"
                  >
                    <p class="text-white text-lg">
                      {translate["pages.status.player.close"]()}
                    </p>
                  </div>
                </Dialog.CloseTrigger>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
