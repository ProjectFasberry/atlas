import { Typography } from "@/shared/ui/typography"
import { translate } from "@/shared/locales/helpers"
import { JoinForm } from "@/shared/components/app/join/components/join-form"

const STEPS = [
  { title: "team.join.step-1-title", text: "team.join.step-1-text" },
  { title: "team.join.step-2-title", text: "team.join.step-2-text" },
  { title: "team.join.step-3-title", text: "team.join.step-3-text" },
] as const

export default function Page() {
  return (
    <div className="flex flex-col gap-8 w-full h-full py-4">
      <section
        className="
          relative overflow-hidden rounded-2xl border border-neutral-800
          bg-gradient-to-br from-green-800/30 via-neutral-900 to-neutral-950 p-6 sm:p-8
        "
      >
        <div className="flex flex-col gap-3 max-w-3xl">
          <span className="w-fit rounded-lg bg-green-500/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-green-400">
            {translate["team.join.badge"]()}
          </span>
          <Typography variant="title">{translate["team.join.title"]()}</Typography>
          <Typography className="text-lg text-neutral-300">
            {translate["team.join.description"]()}
          </Typography>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <Typography className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          {translate["team.join.steps-title"]()}
        </Typography>
        <div className="grid gap-2 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.title} className="flex flex-col gap-1 rounded-xl border border-neutral-800 bg-neutral-900 p-3">
              <Typography className="text-sm font-semibold">
                {translate[step.title]()}
              </Typography>
              <Typography className="text-xs text-neutral-500">
                {translate[step.text]()}
              </Typography>
            </div>
          ))}
        </div>
      </section>

      <JoinForm />
    </div>
  )
}
