import { logError } from "@/shared/lib/log";
import { reatomAsync, withCache, withDataAtom, withErrorAtom, withRetry, withStatusesAtom } from "@reatom/framework";
import { client } from "@/shared/lib/client-wrapper";
import { playerState } from "./player.model";
import { atom, withAssign } from "@reatom/framework";

export type PlayerActivityPayload =
  | { type: "online"; nickname: string; server: string; issued_date: Date; }
  | { type: "offline"; nickname: string; issued_date: Date | null };

export const playerActivity = atom(null, "playerActivity").pipe(
  withAssign((_, name) => ({
    online: atom(null, `${name}.online`).pipe(
      withAssign((_, name) => ({
        fetch: reatomAsync(async (ctx, nickname: string) => {
          return await ctx.schedule(() => client
            .raw.get<PlayerActivityPayload>(`/server/activity/now/${nickname}`, {
              retry: 1
            })
          )
        }, {
          name: `${name}.fetch`,
          onReject: (_, e) => logError(e)
        }).pipe(
          withDataAtom(null),
          withStatusesAtom(),
          withRetry(),
          withErrorAtom()
        )
      }))
    ),
    location: atom(null, `${name}.location`).pipe(
      withAssign((_, name) => ({
        fetch: reatomAsync(async (ctx, nickname: string) => {
          return await ctx.schedule(() =>
            client.get("/server/location/{nickname}", { retry: 1, params: { path: { nickname } } })
          )
        }, {
          name: `${name}.fetch`,
          onReject: (_, e) => logError(e)
        }).pipe(
          withDataAtom(null),
          withStatusesAtom(),
          withCache({ swr: false }),
          withErrorAtom()
        )
      }))
    )
  }))
)

playerState.nickname.onChange((ctx, state) => state && playerActivity.online.fetch(ctx, state))
