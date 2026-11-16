import { reatomComponent, useUpdate } from "@reatom/npm-react"
import { Link } from "@/shared/components/config/link/link"
import { translate } from "@/shared/locales/helpers"
import { userState } from "@/shared/models/app/index.model"
import { balance } from "../models/balance.model"
import { WalletChips } from "./wallet-chips"
import { WalletServerSelect } from "./server-select"

const WalletStripContent = reatomComponent(({ ctx }) => {
  useUpdate(balance.fetch, [])

  return (
    <div className="flex flex-wrap items-center justify-between gap-2
      rounded-xl bg-neutral-900 px-3 py-2">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
          {translate["wallet.label"]()}
        </span>
        <WalletChips size="md" />
      </div>
      <div className="flex items-center gap-3">
        <WalletServerSelect />
        <Link
          href="/wallet"
          className="text-xs font-semibold text-green-400
            duration-150 hover:text-green-300"
        >
          {translate["wallet.title"]()}
        </Link>
      </div>
    </div>
  )
}, "WalletStripContent")

export const WalletStrip = reatomComponent(({ ctx }) => {
  if (!ctx.spy(userState.isAuthed)) return null

  return <WalletStripContent />
}, "WalletStrip")
