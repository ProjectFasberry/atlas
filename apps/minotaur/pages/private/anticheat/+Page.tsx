import { createPageModel } from "@/shared/lib/events"
import { currentUserState } from "@/shared/models/current-user/index.model"
import { ANTICHEAT_READ_PERMISSION } from "@/shared/consts/permissions"
import { anticheat } from "@/shared/components/app/private/models/anticheat.model"
import { AnticheatPanel } from "@/shared/components/app/private/components/anticheat"

const page = createPageModel({
  name: "private.anticheat",
  hooks: {
    onConnect: (ctx) => {
      const permissions = ctx.get(currentUserState.perms) ?? []
      if (!permissions.includes(ANTICHEAT_READ_PERMISSION)) return

      anticheat.fetch(ctx)
    },
    onDisconnect: (ctx) => {
      anticheat.fetch.abort(ctx)
    },
  },
})

export default function Page() {
  return <AnticheatPanel />
}
