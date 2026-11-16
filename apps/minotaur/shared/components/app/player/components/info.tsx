import { reatomComponent } from "@reatom/npm-react";
import { Rate } from "./rate";
import { playerState, wrapAsClientSideAtom } from "../models/player.model";
import { Skeleton } from "@/shared/ui/skeleton";
import { translate } from "@/shared/locales/helpers";
import {
  getPlayerGroupMeta,
  UNKNOWN_PLAYER_GROUP_COLOR,
} from "@/shared/components/app/player/groups";

type Player = ExtractApiData<"getServerPlayerByNickname">["data"]

const PlayerTag = reatomComponent<{ group: Player["group"] }>(({ group }) => {
  const meta = getPlayerGroupMeta(group)
  const title = meta ? translate[meta.label]() : group
  const color = meta?.color ?? UNKNOWN_PLAYER_GROUP_COLOR

  return (
    <div
      title={group}
      style={{ borderColor: color }}
      className="flex items-center justify-center gap-2 rounded-full border px-3 py-0.5"
    >
      <span style={{ backgroundColor: color }} className="size-3 rounded-full" />
      <span>{title}</span>
    </div>
  )
}, "PlayerTag")
const PlayerTags = reatomComponent(({ ctx }) => {
  const data = ctx.spy(playerState.tags)

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {data.map((tag) => <PlayerTag key={tag} group={tag} />)}
    </div>
  )
}, "PlayerTags")

export const PlayerInfo = reatomComponent(({ ctx }) => {
  const nickname = ctx.spy(playerState.nickname);
  const isLoading = ctx.spy(wrapAsClientSideAtom(!nickname));

  return (
    <div className="flex justify-between h-full items-center w-full">
      <div className='flex flex-col gap-2'>
        {isLoading ? (
          <Skeleton className="h-16 w-42" />
        ) : (
          <h1 className="text-4xl font-bold">{nickname}</h1>
        )}
        <PlayerTags />
      </div>
      <div className="flex items-center justify-center w-min">
        <Rate />
      </div>
    </div>
  )
}, "PlayerInfo")
