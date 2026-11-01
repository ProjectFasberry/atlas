import { Skeleton } from "@/shared/ui/skeleton";
import { tv } from "tailwind-variants";
import { Avatar } from "../../../../ui/avatar";
import { reatomComponent, useUpdate } from "@reatom/npm-react";
import { Link } from "@/shared/components/config/link/link";
import { atom } from "@reatom/framework";
import { pageState } from "@/shared/models/page-context.model";
import { playerSLP, playerSLPState, type SeemsLikePlayer } from "../models/player-seems-like.model";
import { Icon } from "@/shared/ui/icon"
import { scrollableVariant } from "@/shared/consts/style-variants";
import { translate } from "@/shared/locales/helpers";
import { Tooltip } from '@ark-ui/react/tooltip'
import { Portal } from '@ark-ui/react/portal'
import { createLink } from "@/shared/components/config/link/link.model";
import { ErrorBlock } from "@/shared/ui/error-block";
import { SummaryNumber } from "@/shared/ui/summary-number";
import { Button } from "@/shared/ui/button";
import { Typography } from "@/shared/ui/typography";

const playerSeemsLikePlayersCountAtom = atom((ctx) => ctx.spy(playerSLP.fetch.dataAtom)?.meta.count ?? 0)

const PlayerSeemsLikeShowToggle = reatomComponent(({ ctx }) => {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          id="hide-section-seems-like"
          aria-label={translate["player.seems-like-players.notShow"]()}
          onClick={() => playerSLPState.settings.isShow.toggle(ctx)}
          className="cursor-pointer"
        >
          <Icon name="sprite:x" className="size-[22px] text-neutral-400" />
        </button>
      </Tooltip.Trigger>
      <Portal>
        <Tooltip.Positioner>
          <Tooltip.Content>
            <span className="text-neutral-400 text-md">
              {translate["player.seems-like-players.notShow"]()}
            </span>
          </Tooltip.Content>
        </Tooltip.Positioner>
      </Portal>
    </Tooltip.Root>
  )
}, "PlayerSeemsLikeShowToggle")

const PlayerSeemsLikePlayersCount = reatomComponent(({ ctx }) =>
  <SummaryNumber value={ctx.spy(playerSeemsLikePlayersCountAtom)} />, "PlayerSeemsLikePlayersCount"
)

const PlayerSeemsLikePlayersRestore = reatomComponent(({ ctx }) => {
  const title = translate["player.seems-like-players.title"]();

  return (
    <div className="flex items-center justify-start w-full">
      <Button
        background="default"
        className="gap-2 h-8 px-3 font-semibold"
        title={title}
        aria-label={title}
        onClick={() => playerSLPState.settings.isShow.toggle(ctx, true)}
      >
        <Icon name="sprite:eye" className="size-4 text-neutral-400" />
        <Typography className="text-sm text-neutral-400">
          {title}
        </Typography>
      </Button>
    </div>
  )
}, "PlayerSeemsLikePlayersRestore")

export const PlayerSeemsLikePlayers = reatomComponent(({ ctx }) => {
  const isShow = ctx.spy(playerSLPState.settings.isShow);
  if (!isShow) return <PlayerSeemsLikePlayersRestore />;

  return (
    <div className="flex flex-col gap-2 w-full h-full">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <h4 className="text-white font-semibold text-2xl">
            {translate["player.seems-like-players.title"]()}
          </h4>
          <PlayerSeemsLikePlayersCount />
        </div>
        <PlayerSeemsLikeShowToggle />
      </div>
      <PlayerSeemsLikePlayersList />
    </div>
  )
}, "PlayerSeemsLikePlayers")

const seemsLikeGridVariant = tv({
  base: `${scrollableVariant()} grid grid-flow-col auto-cols-max scrollbar-h-2 pb-2 whitespace-nowrap overflow-x-auto gap-2 w-full`,
  slots: {
    card: `flex flex-col rounded-lg bg-neutral-900 overflow-hidden w-fit h-fit`,
    cardAvatar: `w-full h-full rounded-lg overflow-hidden flex items-center justify-center`
  }
})

const PlayerSeemsLikePlayersListSkeleton = () => {
  return (
    <div className={seemsLikeGridVariant().base()}>
      {Array.from({ length: 8 }).map((_, idx) => (
        <div key={idx} className={seemsLikeGridVariant().card()}>
          <Skeleton className={seemsLikeGridVariant().cardAvatar({ className: "min-h-16 min-w-16" })} />
        </div>
      ))}
    </div>
  )
}

const PlayerSeemsLikeListItem = ({ nickname, uuid, avatar }: SeemsLikePlayer) => {
  return (
    <div key={uuid} className={seemsLikeGridVariant().card()}>
      <Link
        href={createLink("player", nickname)}
        aria-label={nickname}
        className={seemsLikeGridVariant().cardAvatar()}
      >
        <Avatar url={avatar} nickname={nickname} className="w-16 h-16" />
      </Link>
    </div>
  )
}

const PlayerSeemsLikePlayersList = reatomComponent(({ ctx }) => {
  useUpdate(playerSLP.init, [])

  if (!ctx.spy(pageState.isClientside) || ctx.spy(playerSLP.fetch.statusesAtom).isPending) {
    return <PlayerSeemsLikePlayersListSkeleton />
  }

  const error = ctx.spy(playerSLP.fetch.errorAtom)
  if (error) return <ErrorBlock title={error.message} />

  const data = ctx.spy(playerSLP.fetch.dataAtom)?.data;
  if (!data) return null;

  return (
    <div className={seemsLikeGridVariant().base()}>
      {data.map((player) => <PlayerSeemsLikeListItem key={player.uuid} {...player} />)}
    </div>
  )
}, "PlayerSeemsLikePlayersList")
