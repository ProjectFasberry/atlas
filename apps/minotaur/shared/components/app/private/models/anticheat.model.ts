import { action, atom, reatomAsync, withAbort, withAssign, withErrorAtom, withStatusesAtom } from "@reatom/framework"
import { grimSummary, listGrimFlags, type GrimFlag, type GrimSummaryRow } from "@/shared/api/anticheat"

export type AnticheatData = { flags: GrimFlag[]; summary: GrimSummaryRow[]; hours: number }

export const anticheatState = atom(null, "anticheatState").pipe(
  withAssign((_, name) => ({
    nickname: atom("", `${name}.nickname`),
    check: atom("", `${name}.check`),
    server: atom("", `${name}.server`),
    hours: atom(24, `${name}.hours`),
    data: atom<AnticheatData | null>(null, `${name}.data`),
  })),
)

export const anticheat = atom(null, "anticheat").pipe(
  withAssign((_, name) => ({
    fetch: reatomAsync(async (ctx): Promise<AnticheatData> => {
      const nickname = ctx.get(anticheatState.nickname).trim()
      const check = ctx.get(anticheatState.check).trim()
      const server = ctx.get(anticheatState.server).trim()
      const hours = ctx.get(anticheatState.hours)

      const [flags, summary] = await Promise.all([
        listGrimFlags({
          nickname: nickname || undefined,
          check: check || undefined,
          server: server || undefined,
          limit: 100,
        }),
        grimSummary(hours),
      ])

      return { flags, summary, hours }
    }, {
      name: `${name}.fetch`,
      onFulfill: (ctx, res) => {
        anticheatState.data(ctx, res)
      },
    }).pipe(
      withAbort(),
      withStatusesAtom(),
      withErrorAtom(),
    ),
  })),
)

export const setAnticheatFilter = action((ctx, key: "nickname" | "check" | "server", value: string) => {
  anticheatState[key](ctx, value)
  anticheat.fetch(ctx)
}, "setAnticheatFilter")

export const setAnticheatHours = action((ctx, hours: number) => {
  anticheatState.hours(ctx, hours)
  anticheat.fetch(ctx)
}, "setAnticheatHours")
