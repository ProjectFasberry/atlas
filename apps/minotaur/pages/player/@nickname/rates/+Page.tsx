import { isEmptyArray } from "@/shared/lib/utils";
import { pageState } from "@/shared/models/page-context.model";
import { PageLoader } from "@/shared/ui/page-loader";
import { reatomComponent, useAtom } from "@reatom/npm-react";
import { Typography } from "@/shared/ui/typography"
import { player } from "@/shared/components/app/player/models/player.model";
import { createPageModel } from "@/shared/lib/events";
import { usePageContext } from "vike-react/usePageContext";
import { BackButton } from "@/shared/ui/back-button";
import type { PropsWithChildren } from "react";
import { Noop } from "@/shared/ui/noop";
import { createLink } from "@/shared/components/config/link/link.model";
import { PlayerCard } from "@/shared/ui/player-card";

const RateList = reatomComponent(({ ctx }) => {
  if (!ctx.spy(pageState.isClientside) || ctx.spy(player.rate.fetchList.statusesAtom).isPending) {
    return <PageLoader />
  }

  const data = ctx.spy(player.rate.fetchList.dataAtom)?.data;
  if (!data || isEmptyArray(data)) return <Noop title="пусто" />

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 auto-rows-auto gap-2 w-full h-full">
      {data.map(user => <PlayerCard key={user.initiator} nickname={user.initiator} avatar={user.avatar} />)}
    </div>
  )
}, "RateList")

const PageHeaderWrapper = ({ children, href }: PropsWithChildren & Partial<{ href: string }>) => {
  return (
    <div className="flex items-center gap-2 w-full justify-start">
      <BackButton href={href} />
      {children}
    </div>
  )
}

const page = createPageModel({
  name: "player-rates",
  hooks: {
    onConnect: (ctx) => {
      const nickname = ctx.get(pageState.routeParams).nickname;
      player.rate.refetchAll(ctx, nickname)
    },
    onDisconnect: (ctx) => {
      player.rate.fetchList.abort(ctx)
    },
  }
})

export default function Page() {
  const [_] = useAtom(page.dataAtom)
  const nickname = usePageContext().routeParams.nickname;

  return (
    <div className='flex flex-col gap-8 w-full h-full'>
      <PageHeaderWrapper href={createLink("player", nickname)}>
        <Typography variant="title">Оценившие {nickname}</Typography>
      </PageHeaderWrapper>
      <RateList />
    </div>
  )
}
