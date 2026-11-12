import { onConnect } from "@reatom/framework";
import { reatomComponent } from "@reatom/npm-react";
import { Logotype } from "@/shared/components/app/layout/components/logotype";
import { Link } from "@/shared/components/config/link/link";
import { serverStatus } from "@/shared/components/app/intro/models/intro.model";
import { socialsAtom } from "@/shared/models/shared.model";
import { pageState } from "@/shared/models/page-context.model";
import { expImage } from "@/shared/consts/images";
import { getStaticImage } from "@/shared/lib/helpers";
import { env } from "@/shared/env";
import { translate } from "@/shared/locales/helpers";

const brandImage = getStaticImage("images/village_pillage.webp");

onConnect(serverStatus.fetch.dataAtom, serverStatus.fetch)

const AuthOnline = reatomComponent(({ ctx }) => {
  if (!ctx.spy(pageState.isClientside)) {
    return <span className="inline-block h-4 w-8 rounded-sm bg-neutral-700/60" />
  }

  const online = ctx.spy(serverStatus.fetch.dataAtom)?.proxy.online

  return <span>{online ?? "—"}</span>
}, "AuthOnline")

export const AuthBrand = reatomComponent(({ ctx }) => {
  const socials = ctx.spy(socialsAtom)
  const telegram = socials.find((social) => social.value === "tg")?.href
  const discord = socials.find((social) => social.value === "ds")?.href

  return (
    <aside
      className="
        relative hidden lg:flex flex-col justify-between overflow-hidden rounded-2xl
        border border-neutral-800 h-[600px] p-8 bg-neutral-900
      "
    >
      <img
        src={brandImage}
        alt=""
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/20" />

      <div className="relative z-10">
        <Logotype />
      </div>

      <div className="relative z-10 flex flex-col gap-4 max-w-md">
        <span className="w-fit rounded-lg bg-green-500/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-green-400">
          {translate["index.intro.subtitle"]()}
        </span>
        <h2 className="font-[PIXY] text-4xl leading-[1.1]">
          {translate["auth.page.brand-title"]()}
        </h2>
        <p className="text-neutral-300">
          {translate["auth.page.brand-description"]()}
        </p>
        <div className="flex items-center gap-2 text-sm">
          <img src={expImage} width={20} height={20} alt="" />
          <span className="font-semibold"><AuthOnline /></span>
          <span className="text-neutral-400">{translate["auth.page.online"]()}</span>
        </div>
      </div>

      <div className="relative z-10 flex flex-wrap items-center gap-2">
        <Link
          href="/report"
          className="rounded-xl bg-neutral-800/80 px-3 py-2 text-sm font-semibold duration-150 hover:bg-neutral-700"
        >
          {translate["auth.page.support"]()}
        </Link>
        <a
          href={`${env.VITE_LANDING_URL}/rules`}
          className="rounded-xl bg-neutral-800/80 px-3 py-2 text-sm font-semibold duration-150 hover:bg-neutral-700"
        >
          {translate["auth.page.rules"]()}
        </a>
        {telegram && (
          <a
            href={telegram}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-neutral-800/80 px-3 py-2 text-sm font-semibold duration-150 hover:bg-neutral-700"
          >
            Telegram
          </a>
        )}
        {discord && (
          <a
            href={discord}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-neutral-800/80 px-3 py-2 text-sm font-semibold duration-150 hover:bg-neutral-700"
          >
            Discord
          </a>
        )}
      </div>
    </aside>
  )
}, "AuthBrand")
