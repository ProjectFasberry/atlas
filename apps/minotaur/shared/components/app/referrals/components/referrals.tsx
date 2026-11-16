import { reatomComponent } from "@reatom/npm-react";
import { referralLinkUrl, referrals } from "../models/referrals.model";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon"
import { toast } from "sonner";
import { env } from "@/shared/env";
import { spawn } from "@reatom/framework";
import { useUpdate } from "@reatom/npm-react";
import { translate } from "@/shared/locales/helpers";
import { Typography } from "@/shared/ui/typography";

const WIKI_REFERRALS_URL = `${env.VITE_LANDING_URL}/wiki/referals`;

const copyReferralsLink = (ctx: Parameters<typeof referrals.createLink>[0]) => {
  spawn(ctx, async (spawnCtx) => {
    try {
      const link = await referrals.createLink(spawnCtx);
      if (!link) return;

      await navigator.clipboard.writeText(referralLinkUrl(link.token));
      toast.success(translate["shared.copyed-to-clipboard"]());
    } catch {
      toast.error("Ссылку сейчас выдать нельзя");
    }
  });
}

export const ReferralsLink = reatomComponent(({ ctx }) => {
  useUpdate((ctx) => { referrals.stats(ctx) }, []);

  const stats = ctx.spy(referrals.stats.dataAtom);
  const pending = ctx.spy(referrals.createLink.statusesAtom).isPending;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-2 justify-start w-full">
      <Button
        background="positive"
        className="gap-3 sm:w-fit w-full py-1 sm:h-10 min-h-10 justify-start"
        onClick={() => copyReferralsLink(ctx)}
        disabled={pending || stats?.remaining === 0}
      >
        <Icon name="sprite:plus" className="min-w-6 min-h-6 size-6 sm:min-w-5 sm:min-h-5 sm:size-5" />
        <Typography className="leading-5 text-wrap font-semibold truncate">
          Пригласить игрока
        </Typography>
      </Button>
      <a
        href={WIKI_REFERRALS_URL}
        target="_blank"
        className="
        bg-neutral-50 text-neutral-950
          flex min-w-0 w-full sm:w-fit px-4 rounded-xl py-1 sm:h-10 min-h-10 items-center gap-3
        "
      >
        <Icon name="sprite:book" className="min-w-6 min-h-6 size-6 sm:min-w-5 sm:min-h-5 sm:size-5" />
        <Typography className="leading-5 text-wrap font-semibold truncate ">
          Как работает реферальная система
        </Typography>
      </a>
      {stats ? (
        <Typography className="text-sm text-neutral-400">
          Осталось {stats.remaining} из {stats.limit} за 12 месяцев
        </Typography>
      ) : null}
    </div>
  )
}, "ReferralsLink")
