import { onMount } from "solid-js"
import { Typography } from "@/shared/ui/typography"
import { serverStatus } from "@/shared/models/server-status.model"
import { reatomComponent } from "@/shared/lib/reatom"
import { useAtomAccessor } from "@/shared/lib/utils"
import { translate } from "@/shared/locales/helpers"

/** Live online counter for one server, loaded once per visit. */
export const ServerStatusBadge = reatomComponent<{ id: string }>(({ ctx, id }) => {
  const status = useAtomAccessor(serverStatus.fetch.dataAtom)
  const statuses = useAtomAccessor(serverStatus.fetch.statusesAtom)

  onMount(() => {
    if (!status() && !statuses().isPending) serverStatus.fetch(ctx)
  })

  const server = () => status()?.servers?.[id]
  const available = () => server()?.available ?? false
  const label = () => {
    const current = server()

    if (!current) return translate["servers.status.unknown"]()
    if (!available()) return translate["servers.status.offline"]()

    return translate["servers.status.online"]({ count: current.online ?? 0 })
  }

  return (
    <span class="flex w-fit items-center gap-2 transparent-slot px-3 py-1">
      <span
        class="h-2 w-2 rounded-full"
        classList={{
          "bg-green-500": available(),
          "bg-red-500": Boolean(server()) && !available(),
          "bg-neutral-500": !server(),
        }}
      />
      <Typography class="text-xs text-neutral-200 sm:text-sm">{label()}</Typography>
    </span>
  )
}, "ServerStatusBadge")
