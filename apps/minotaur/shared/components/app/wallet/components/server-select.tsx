import { reatomComponent } from "@reatom/npm-react"
import { Menu } from "@ark-ui/react/menu"
import { Button } from "@/shared/ui/button"
import { Icon } from "@/shared/ui/icon"
import { Typography } from "@/shared/ui/typography"
import { menuVariant } from "@/shared/ui/menu"
import { translate } from "@/shared/locales/helpers"
import { balance, balanceState } from "../models/balance.model"
import { GAME_SERVERS } from "@/shared/consts/game"

export const WalletServerSelect = reatomComponent(({ ctx }) => {
  const current = ctx.spy(balanceState.targetServer)
  const pending = ctx.spy(balance.fetch.statusesAtom).isPending

  return (
    <Menu.Root onSelect={(details) => balanceState.targetServer(ctx, details.value)}>
      <Menu.Trigger asChild>
        <Button background="default" className="h-8 gap-1 px-2 text-xs">
          <span className="text-neutral-400">{translate["player.balance.server"]()}</span>
          <span className="font-semibold capitalize text-neutral-100">{current}</span>
          <Icon name="sprite:chevron-down" className="size-3.5 text-neutral-500" />
        </Button>
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content className={menuVariant.content("min-w-40")}>
          <Menu.Arrow className={menuVariant.arrow()}>
            <Menu.ArrowTip className={menuVariant.arrowTip()} />
          </Menu.Arrow>
          <div className="flex w-full flex-col gap-1 p-1">
            <Typography className="px-2 text-xs" color="gray">
              {translate["player.balance.servers"]()}
            </Typography>
            {GAME_SERVERS.map((server) => (
              <Menu.Item key={server} value={server} asChild>
                <Button
                  data-state={current === server ? "active" : "inactive"}
                  disabled={pending}
                  className="h-8 justify-start px-2 text-sm
                    data-[state=active]:text-green-400 data-[state=inactive]:text-neutral-100"
                >
                  <span className="capitalize">{server}</span>
                </Button>
              </Menu.Item>
            ))}
          </div>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  )
}, "WalletServerSelect")
