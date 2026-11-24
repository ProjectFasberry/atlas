import { createEffect, For, onCleanup, onMount, Show } from "solid-js"
import { serverStatus, fetchPlayerAvatars } from "../(models)/server-status.model"
import { pageState } from "@/shared/models/page.model"
import { translate } from "@/shared/locales/helpers"
import { useAtomAccessor } from "@/shared/lib/utils"
import { reatomComponent } from "@/shared/lib/reatom"
import { ServerStatusSkeleton } from "./server-status-skeleton"
import { PlayerStatus } from "./player-status"

/** Player list of the proxy, with a skeleton until the first client-side load. */
export const ServerStatus = reatomComponent(({ ctx }) => {
  const isClient = useAtomAccessor(pageState.isClient)

  onMount(() => {
    serverStatus.fetch(ctx)
  })

  onCleanup(() => {
    serverStatus.fetch.abort(ctx)
  })

  const data = useAtomAccessor(serverStatus.fetch.dataAtom)
  const statuses = useAtomAccessor(serverStatus.fetch.statusesAtom);

  createEffect(() => {
    const players = data()?.proxy.players ?? []
    if (players.length > 0) fetchPlayerAvatars(ctx, players)
  })

  return (
    <Show
      when={isClient() && !statuses().isPending}
      fallback={<ServerStatusSkeleton />}
    >
      <Show when={data()}>
        {(data) => {
          const isServerOnline = data().proxy.status === 'online'
          const playersList = data().proxy.players

          return (
            <>
              {!isServerOnline && (
                <p class="text-xl lg:text-2xl">
                  {translate["pages.status.players.unavailable"]()}
                </p>
              )}
              {(isServerOnline && playersList) && (
                <>
                  <p class="text-xl lg:text-2xl">
                    {translate["pages.status.players.title"]({
                      online: data().proxy.online,
                      max: data().proxy.max,
                    })}
                  </p>
                  <div class="flex flex-col gap-2 h-full">
                    {playersList.length === 0 && (
                      <p class="px-2">
                        {translate["pages.status.players.empty"]()}
                      </p>
                    )}
                    <For each={playersList}>
                      {(nickname) => <PlayerStatus nickname={nickname} />}
                    </For>
                  </div>
                </>
              )}
            </>
          )
        }}
      </Show>
    </Show>
  )
}, "ServerStatus")
