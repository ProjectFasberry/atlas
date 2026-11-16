import { reatomComponent, useUpdate } from "@reatom/npm-react"
import { Typography } from "@/shared/ui/typography"
import { Icon } from "@/shared/ui/icon"
import { Link } from "@/shared/components/config/link/link"
import { belkoinImage, charismImage } from "@/shared/consts/images"
import { translate } from "@/shared/locales/helpers"
import { balance, balanceState } from "../models/balance.model"
import { WalletCurrency } from "./wallet-currency"
import { WalletServerSelect } from "./server-select"

const CARDS = [
  { wallet: "BELKOIN", atom: balanceState.belkoinBalance, image: belkoinImage, hint: "wallet.hint.belkoin" },
  { wallet: "CHARISM", atom: balanceState.charismBalance, image: charismImage, hint: "wallet.hint.charism", serverScoped: true },
] as const

export const WalletView = reatomComponent(({ ctx }) => {
  useUpdate(balance.fetch, [])

  return (
    <div className="flex h-full w-full flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Typography className="text-2xl font-semibold sm:text-3xl">
          {translate["wallet.title"]()}
        </Typography>
        <Typography className="max-w-2xl text-sm text-neutral-400">
          {translate["wallet.description"]()}
        </Typography>
      </div>
      <section className="flex w-full flex-col gap-5 rounded-xl bg-neutral-900 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
            {translate["wallet.label"]()}
          </span>
          <div className="flex items-center gap-3">
            <WalletServerSelect />
            <Link
              href="/store"
              className="flex items-center gap-1 text-xs font-semibold
                text-green-400 duration-150 hover:text-green-300"
            >
              {translate["home.balance.to_store"]()}
              <Icon name="sprite:arrow-right" className="size-4" />
            </Link>
          </div>
        </div>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-stretch sm:gap-6">
          <WalletCurrency {...CARDS[0]} hint={translate[CARDS[0].hint]()} />
          <div className="h-px w-full shrink-0 bg-neutral-800 sm:h-auto sm:w-px" />
          <WalletCurrency {...CARDS[1]} hint={translate[CARDS[1].hint]()} />
        </div>
      </section>
    </div>
  )
}, "WalletView")
