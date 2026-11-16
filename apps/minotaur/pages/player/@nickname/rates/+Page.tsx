import { pageState } from "@/shared/models/page-context.model";
import { useAtom } from "@reatom/npm-react";
import { atom, type Ctx } from "@reatom/framework";
import { player } from "@/shared/components/app/player/models/player.model";
import { createPageModel } from "@/shared/lib/events";
import { usePageContext } from "vike-react/usePageContext";
import { PlayerRates } from "@/shared/components/app/player/components/rates";

const lastNicknameAtom = atom<string | null>(null, "player-rates.lastNickname")

const loadRates = (ctx: Ctx, nickname: Maybe<string>) => {
  if (!nickname || ctx.get(lastNicknameAtom) === nickname) return;

  // The model keeps its route-params subscription after the page unmounts,
  // so ignore navigations that are not the rates route.
  if (!ctx.get(pageState.urlPathname)?.endsWith("/rates")) return;

  lastNicknameAtom(ctx, nickname);
  player.rate.refetchAll(ctx, nickname)
}

const page = createPageModel({
  name: "player-rates",
  hooks: {
    onConnect: (ctx) => {
      loadRates(ctx, ctx.get(pageState.routeParams).nickname)
    },
    onSpy: (ctx, _, routeParams) => {
      loadRates(ctx, routeParams.nickname)
    },
    onDisconnect: (ctx) => {
      player.rate.fetchList.abort(ctx)
      lastNicknameAtom(ctx, null)
    },
  },
  spyedAtom: pageState.routeParams
})

export default function Page() {
  const [_] = useAtom(page.dataAtom)
  const nickname = usePageContext().routeParams.nickname;

  return <PlayerRates nickname={nickname} />
}
