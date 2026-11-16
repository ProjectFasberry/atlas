import { reatomComponent, useUpdate } from "@reatom/npm-react";
import { spawn } from "@reatom/framework";
import { toast } from "sonner";
import { env } from "@/shared/env";
import { referralLinkUrl, referrals } from "../models/referrals.model";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { Input } from "@/shared/ui/input";
import { Typography } from "@/shared/ui/typography";
import { translate } from "@/shared/locales/helpers";

const WIKI_REFERRALS_URL = `${env.VITE_LANDING_URL}/wiki/referals`;

const copyLink = (ctx: Parameters<typeof referrals.createLink>[0], token: string) => {
  spawn(ctx, async () => {
    try {
      await navigator.clipboard.writeText(referralLinkUrl(token));
      toast.success(translate["shared.copyed-to-clipboard"]());
    } catch {
      toast.error("Не удалось скопировать ссылку");
    }
  });
};

export const ReferralsLink = reatomComponent(({ ctx }) => {
  useUpdate((ctx) => { referrals.stats(ctx) }, []);

  const stats = ctx.spy(referrals.stats.dataAtom);
  const link = ctx.spy(referrals.createLink.dataAtom);
  const pending = ctx.spy(referrals.createLink.statusesAtom).isPending;

  const used = stats?.used ?? 0;
  const limit = stats?.limit ?? 5;
  const remaining = stats?.remaining ?? limit;
  const progress = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;

  const createAndCopy = () => {
    spawn(ctx, async (spawnCtx) => {
      try {
        const created = await referrals.createLink(spawnCtx);
        if (!created) return;

        await navigator.clipboard.writeText(referralLinkUrl(created.token));
        toast.success(translate["shared.copyed-to-clipboard"]());
      } catch {
        toast.error("Ссылку сейчас выдать нельзя");
      }
    });
  };

  return (
    <section className="flex w-full flex-col gap-4 rounded-xl bg-neutral-900 p-4 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Приглашай друзей</h2>
          <Typography className="max-w-xl text-sm text-neutral-400">
            Награда приходит после 24 часов и 3 часов игры приглашённого. Лимит - 5
            принятых приглашений за скользящие 12 месяцев.
          </Typography>
        </div>
        <div className="flex shrink-0 items-baseline gap-1 sm:flex-col sm:items-end sm:gap-0">
          <span className="text-3xl font-semibold">{remaining}</span>
          <span className="text-xs text-neutral-500">из {limit} осталось</span>
        </div>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-800">
        <div className="h-full rounded-full bg-green-500 transition-[width]" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button
          background="positive"
          className="h-10 w-full justify-start gap-2 text-sm font-semibold sm:w-fit"
          onClick={createAndCopy}
          disabled={pending || remaining === 0}
        >
          <Icon name="sprite:plus" className="size-5" />
          {link ? "Новая ссылка" : "Пригласить игрока"}
        </Button>
        <a
          href={WIKI_REFERRALS_URL}
          target="_blank"
          rel="noreferrer"
          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-neutral-800 px-4 text-sm font-semibold text-neutral-200 transition-colors hover:bg-neutral-700 sm:w-fit"
        >
          <Icon name="sprite:book" className="size-5" />
          Как это работает
        </a>
      </div>

      {link ? (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <Input
              readOnly
              value={referralLinkUrl(link.token)}
              onFocus={(event) => event.currentTarget.select()}
              className="h-9 min-w-0 flex-1 text-xs"
              aria-label="Реферальная ссылка"
            />
            <Button
              background="default"
              className="h-9 shrink-0 text-xs font-semibold"
              onClick={() => copyLink(ctx, link.token)}
            >
              Копировать
            </Button>
          </div>
          <span className="text-[11px] text-neutral-500">
            Ссылка действует 7 дней; после новой генерации старая перестаёт работать.
          </span>
        </div>
      ) : null}

      {remaining === 0 ? (
        <Typography className="text-xs text-red-400">
          Лимит приглашений за 12 месяцев исчерпан.
        </Typography>
      ) : null}
    </section>
  );
}, "ReferralsLink");
