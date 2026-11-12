import { useAtom } from "@reatom/npm-react"
import { Typography } from "@/shared/ui/typography"
import { translate } from "@/shared/locales/helpers"
import { JoinForm } from "@/shared/components/app/join/components/join-form"
import { resetJoin } from "@/shared/components/app/join/models/join.model"
import { createPageModel } from "@/shared/lib/events"

const STEPS = [
  { title: "team.join.step-1-title", text: "team.join.step-1-text" },
  { title: "team.join.step-2-title", text: "team.join.step-2-text" },
  { title: "team.join.step-3-title", text: "team.join.step-3-text" },
] as const

const page = createPageModel({
  name: "join",
  hooks: {
    onDisconnect: (ctx) => resetJoin(ctx),
  }
})

export default function Page() {
  const [_] = useAtom(page.dataAtom)

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto pt-4 pb-24 sm:pb-4">
      <section
        className="
          relative overflow-hidden rounded-2xl border border-neutral-800
          bg-linear-to-br from-green-800/30 via-neutral-900 to-neutral-950 p-6 sm:p-8
        "
      >
        <div className="flex flex-col gap-3 max-w-3xl">
          <span className="w-fit rounded-lg bg-green-500/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-green-400">
            {translate["team.join.badge"]()}
          </span>
          <h1 className="text-2xl font-bold sm:text-3xl">
            {translate["team.join.title"]()}
          </h1>
          <Typography className="text-lg text-neutral-300">
            {translate["team.join.description"]()}
          </Typography>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
        <aside className="flex flex-col gap-4">
          <Typography className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            {translate["team.join.steps-title"]()}
          </Typography>
          <ol className="flex flex-col gap-3">
            {STEPS.map((step, idx) => (
              <li key={step.title} className="flex gap-3 rounded-xl border border-neutral-800 bg-neutral-900/40 p-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-green-500/15 text-sm font-semibold text-green-400">
                  {idx + 1}
                </span>
                <div className="flex flex-col gap-0.5">
                  <Typography className="text-sm font-semibold">
                    {translate[step.title]()}
                  </Typography>
                  <Typography className="text-xs text-neutral-500">
                    {translate[step.text]()}
                  </Typography>
                </div>
              </li>
            ))}
          </ol>
        </aside>

        <JoinForm />
      </div>
    </div>
  )
}
