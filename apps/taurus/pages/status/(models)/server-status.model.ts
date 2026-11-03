import { mainClient } from "@/shared/api/client";
import { reatomAsync, withAbort, withCache, withDataAtom, withErrorAtom, withStatusesAtom } from "@reatom/framework"
import { atom, withAssign } from "@reatom/framework";

export type Player = { uuid: string; name_raw: string };
export type PlayerStatusProps = { nickname: string }

/** Head of every online player: `undefined` until loaded, `null` when the request failed. */
export const playerAvatars = atom<Record<string, string | null>>({}, "playerAvatars");

export const fetchPlayerAvatars = reatomAsync(async (ctx, nicknames: string[]) => {
  const entries = await Promise.all(
    nicknames.map(async (nickname) => {
      const avatar = await mainClient
        .GET("/server/player/{nickname}", {
          params: { path: { nickname } },
          signal: ctx.controller.signal,
        })
        .then(r => r.data?.data?.avatar ?? null)
        .catch(() => null);

      return [nickname, avatar] as const;
    })
  );

  playerAvatars(ctx, Object.fromEntries(entries));
}, "fetchPlayerAvatars");

export const serverStatus = atom(null, "serverStatus").pipe(
  withAssign((_, name) => ({
    fetch: reatomAsync(async (ctx) => {
      const cb = await mainClient
        .GET("/server/status", {
          searchParams: { type: "servers" },
          signal: ctx.controller.signal
        })
        .then(r => r.data?.data ?? null)

      return await ctx.schedule(() => cb)
    }, `${name}.fetch`).pipe(
      withCache({ swr: false }),
      withDataAtom(),
      withStatusesAtom(),
      withAbort(),
      withErrorAtom()
    )
  }))
)
