import { reatomAsync, withDataAtom, withErrorAtom, withStatusesAtom } from "@reatom/framework";
import { playerState } from "./player.model";
import { action, atom, withAssign } from "@reatom/framework";
import { toast } from "sonner";
import { dayjs } from "@/shared/lib/dayjs";
import { client } from "@/shared/lib/client-wrapper";
import { withSsr } from "@/shared/models/ssr";
import { setCookie } from "@/shared/lib/cookie-utils";
import { translate } from "@/shared/locales/helpers"

export const playerSeemsLikePlayersIsShowKey = "playerSLPState.isShow"
type SeemsLikePlayersPayload = ExtractApiData<"getServerSeems-likeByNickname">["data"]
export type SeemsLikePlayer = SeemsLikePlayersPayload["data"][number];

export const playerSLPState = atom(null, "playerSLPState").pipe(
  withAssign((_, name) => ({
    settings: atom(null, `${name}.settings`).pipe(
      withAssign(() => ({
        isShow: atom(true, `${name}.isShow`).pipe(
          withSsr(playerSeemsLikePlayersIsShowKey),
          withAssign((_, name) => ({
            toggle: action((ctx, inputValue?: boolean) => {
              const isInputed = typeof inputValue !== 'undefined'

              const value = isInputed ? inputValue : !ctx.get(playerSLPState.settings.isShow);

              setCookie(playerSeemsLikePlayersIsShowKey, String(value), {
                maxAgeMs: dayjs().add(1, "month").diff(dayjs()), path: "/"
              })

              playerSLPState.settings.isShow(ctx, value);

              if (!isInputed) {
                if (!value) {
                  toast.success(translate["player.seems-like-players.hidden"]())
                }
              }
            }, `${name}.toggle`)
          }))
        )
      }))
    )
  }))
)

export const playerSLP = atom(null, "playerSLP").pipe(
  withAssign((_, name) => ({
    fetch: reatomAsync(async (ctx, nickname: string) => {
      playerSLP.fetch.dataAtom.reset(ctx);

      const result = await client.get("/server/seems-like/{nickname}", {
        signal: ctx.controller.signal,
        params: { path: { nickname }, query: { limit: 8 } }
      })

      return result
    }, `${name}.fetch`).pipe(
      withDataAtom(null),
      withStatusesAtom(),
      withErrorAtom()
    ),
    init: action((ctx) => {
      const nickname = ctx.get(playerState.nickname)
      if (!nickname) return null;

      playerSLP.fetch(ctx, nickname)
    })
  }))
)

playerState.nickname.onChange((ctx, state) => state && playerSLP.fetch(ctx, state))
