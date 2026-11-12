import { type ReactNode } from "react";
import { reatomComponent } from "@reatom/npm-react";
import { Link } from "@/shared/components/config/link/link";
import { socialsAtom } from "@/shared/models/shared.model";
import { pageState } from "@/shared/models/page-context.model";
import { getNextPath } from "@/shared/lib/auth-redirect";
import { env } from "@/shared/env";
import { Icon } from "@/shared/ui/icon";
import { Typography } from "@/shared/ui/typography";
import { translate } from "@/shared/locales/helpers";

const supportEmail = `support@${env.VITE_MAIN_DOMAIN}`;

const ForgotMethod = ({ icon, title, children }: {
  icon: "sprite:device-desktop" | "sprite:question-mark",
  title: string,
  children: ReactNode
}) => (
  <section className="flex flex-col gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 sm:p-5">
    <div className="flex items-center gap-3">
      <span className="flex items-center justify-center size-10 rounded-xl bg-neutral-800">
        <Icon name={icon} className="size-5 text-green-400" />
      </span>
      <Typography className="text-base font-semibold">{title}</Typography>
    </div>
    {children}
  </section>
);

export const ForgotPassword = reatomComponent(({ ctx }) => {
  const next = getNextPath(ctx.get(pageState.urlParsed)?.search);
  const backHref = next ? `/auth?next=${encodeURIComponent(next)}` : "/auth";
  const telegram = ctx.spy(socialsAtom).find((social) => social.value === "tg")?.href;
  const mailto = `mailto:${supportEmail}?subject=${encodeURIComponent(translate["auth.forgot.title"]())}`;

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto px-4 py-6 sm:py-10">
      <div className="flex flex-col gap-2">
        <Link
          href={backHref}
          className="w-fit text-sm text-neutral-400 duration-150 hover:text-neutral-50"
        >
          {translate["auth.forgot.back"]()}
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold">
          {translate["auth.forgot.title"]()}
        </h1>
        <Typography className="text-neutral-400">
          {translate["auth.forgot.description"]()}
        </Typography>
      </div>
      <ForgotMethod icon="sprite:device-desktop" title={translate["auth.forgot.game.title"]()}>
        <Typography className="text-sm text-neutral-300">
          {translate["auth.forgot.game.description"]()}
        </Typography>
        <ol className="flex flex-col gap-1 text-sm text-neutral-400 list-decimal pl-5">
          <li>{translate["auth.forgot.game.step-1"]()}</li>
          <li>{translate["auth.forgot.game.step-2"]()}</li>
          <li>{translate["auth.forgot.game.step-3"]()}</li>
        </ol>
        <Typography className="text-xs text-neutral-500">
          {translate["auth.forgot.game.note"]()}
        </Typography>
      </ForgotMethod>
      <ForgotMethod icon="sprite:question-mark" title={translate["auth.forgot.support.title"]()}>
        <Typography className="text-sm text-neutral-300">
          {translate["auth.forgot.support.description"]({ email: supportEmail })}
        </Typography>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={mailto}
            className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold duration-150 hover:bg-green-500"
          >
            {translate["auth.forgot.support.action"]()}
          </a>
          {telegram && (
            <a
              href={telegram}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-neutral-800 px-4 py-2 text-sm font-semibold duration-150 hover:bg-neutral-700"
            >
              {translate["auth.forgot.support.telegram"]()}
            </a>
          )}
        </div>
      </ForgotMethod>
    </div>
  );
}, "ForgotPassword");
