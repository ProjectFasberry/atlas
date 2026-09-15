import { reatomComponent } from "@reatom/npm-react"
import { Button } from "@/shared/ui/button"
import { Icon } from "@/shared/ui/icon"
import { tv } from "tailwind-variants"
import { isIdentityAtom, player, playerState, wrapAsClientSideAtom, type PlayerRatePayload } from "../models/player.model"
import { navigate } from "vike/client/router"
import { Skeleton } from "@/shared/ui/skeleton"

const rateButtonVariant = tv({
  slots: {
    base: "flex border-2 group rounded-full h-10 duration-150 px-2 py-1 *:duration-150 items-center gap-1",
    child: "[&:is(svg)]:size-6",
  },
  variants: {
    state: {
      unrated: {
        base: "border-neutral-700",
      },
      rated: {
        base: "border-red/60 bg-red/70 backdrop-blur-md",
        child: "group-data-[state=rated]:fill-neutral-50 group-data-[state=rated]:text-neutral-50",
      },
      self: {
        base: "bg-neutral-50 active:scale-100",
        child: "group-data-[state=filled]:text-neutral-900 group-data-[state=filled]:fill-neutral-900",
      },
    },
  }
})

type RateButtonProps = PlayerRatePayload & {
  nickname: string
  self?: boolean
}

const RateButton = reatomComponent<RateButtonProps>(({ ctx, count, nickname, isRated, self }) => {
  const state = self ? "self" : isRated ? "rated" : "unrated"
  const { base, child } = rateButtonVariant({ state })

  return (
    <Button
      data-state={self ? "filled" : isRated ? "rated" : "unrated"}
      disabled={ctx.spy(player.rate.submit.statusesAtom).isPending}
      onClick={() =>
        self
          ? navigate(`/player/${nickname}/rates`)
          : player.rate.submit(ctx, nickname)
      }
      className={base()}
    >
      <Icon name="sprite:heart" className={child()} />
      <div className="flex items-center justify-center relative h-10 w-6 aspect-square">
        <span className={child({ className: "font-semibold text-[20px] relative -top-[1px]" })}>{count}</span>
      </div>
    </Button>
  )
}, "RateButton")

export const Rate = reatomComponent(({ ctx }) => {
  const nickname = ctx.spy(playerState.nickname);

  const isLoading = ctx.spy(wrapAsClientSideAtom(!nickname))
  if (isLoading) return <Skeleton className="h-10 w-24" />

  const rate = ctx.spy(playerState.rate)
  if (!rate || !nickname) return null;

  return (
    <RateButton
      {...rate}
      nickname={nickname}
      self={ctx.spy(isIdentityAtom)}
    />
  )
}, "Rate")
