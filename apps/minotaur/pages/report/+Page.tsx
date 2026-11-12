import { type ReactNode } from "react"
import { reatomComponent } from "@reatom/npm-react"
import { socialsAtom } from "@/shared/models/shared.model"
import { translate } from "@/shared/locales/helpers"
import { Icon } from "@/shared/ui/icon"
import { Typography } from "@/shared/ui/typography"

const ReportCard = ({ title, children }: { title: string, children: ReactNode }) => (
  <section className="flex flex-col gap-2 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
    <Typography className="text-sm font-semibold">{title}</Typography>
    {children}
  </section>
)

const ReportContent = reatomComponent(({ ctx }) => {
  const socials = ctx.spy(socialsAtom)
  const telegram = socials.find((social) => social.value === "tg")?.href
  const discord = socials.find((social) => social.value === "ds")?.href

  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto py-4">
      <div className="flex flex-col gap-3">
        <span className="w-fit rounded-lg bg-green-500/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-green-400">
          {translate["report.badge"]()}
        </span>
        <h1 className="text-2xl font-bold sm:text-3xl">
          {translate["report.title"]()}
        </h1>
        <Typography className="text-lg text-neutral-400">
          {translate["report.description"]()}
        </Typography>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ReportCard title={translate["report.what-title"]()}>
          <ul className="flex flex-col gap-1 text-sm text-neutral-400 list-disc pl-5">
            <li>{translate["report.what-1"]()}</li>
            <li>{translate["report.what-2"]()}</li>
            <li>{translate["report.what-3"]()}</li>
          </ul>
        </ReportCard>

        <ReportCard title={translate["report.include-title"]()}>
          <ul className="flex flex-col gap-1 text-sm text-neutral-400 list-disc pl-5">
            <li>{translate["report.include-1"]()}</li>
            <li>{translate["report.include-2"]()}</li>
            <li>{translate["report.include-3"]()}</li>
            <li>{translate["report.include-4"]()}</li>
          </ul>
        </ReportCard>
      </div>

      <section className="flex flex-col gap-3">
        <Typography className="text-sm font-semibold text-neutral-300">
          {translate["report.contact-title"]()}
        </Typography>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {discord && (
            <a
              href={discord}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-green-600 px-4 text-sm font-semibold duration-150 hover:bg-green-500"
            >
              <Icon name="sprite:brand-discord" className="size-5" />
              {translate["report.discord"]()}
            </a>
          )}
          {telegram && (
            <a
              href={telegram}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800 px-4 text-sm font-semibold duration-150 hover:bg-neutral-700"
            >
              <Icon name="sprite:brand-telegram" className="size-5" />
              {translate["report.telegram"]()}
            </a>
          )}
          <a
            href="/rules"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-neutral-700 px-4 text-sm font-semibold text-neutral-300 duration-150 hover:bg-neutral-800"
          >
            {translate["report.rules"]()}
          </a>
        </div>
        <Typography className="text-xs text-neutral-500">
          {translate["report.tip"]()}
        </Typography>
      </section>
    </div>
  )
}, "ReportContent")

export default function Page() {
  return (
    <div className="flex flex-col gap-8 w-full h-full pb-24 sm:pb-4">
      <ReportContent />
    </div>
  )
}
