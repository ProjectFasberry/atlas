import { Typography } from "@/shared/ui/typography";
import { translate } from "@/shared/locales/helpers";
import { serverStatus } from "@/shared/models/server-status.model";
import { useAtomAccessor } from "@/shared/lib/utils";

export const OnlineBadge = () => {
  const status = useAtomAccessor(serverStatus.fetch.dataAtom)

  const isOnline = () => status()?.proxy.status === "online"
  const players = () => status()?.proxy.online

  return (
    <div class="flex w-fit items-center gap-2 transparent-slot px-3 py-1 select-none">
      <span
        class="h-2 w-2 rounded-full"
        classList={{
          "bg-green-500": isOnline(),
          "bg-red-500": !!status() && !isOnline(),
          "bg-neutral-500 animate-pulse": !status()
        }}
      />
      <Typography class="text-xs sm:text-sm text-neutral-200">
        {players() === undefined
          ? "···"
          : translate["welcome.online"]({ count: players() ?? 0 })}
      </Typography>
    </div>
  )
}
