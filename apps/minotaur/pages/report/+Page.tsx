import { reatomComponent } from "@reatom/npm-react"
import { socialsAtom } from "@/shared/models/shared.model"
import { translate } from "@/shared/locales/helpers"
import { Button } from "@/shared/ui/button"
import { Typography } from "@/shared/ui/typography"

const ReportContent = reatomComponent(({ ctx }) => {
  const socials = ctx.spy(socialsAtom)
  const telegram = socials.find((social) => social.value === "tg")?.href
  const discord = socials.find((social) => social.value === "ds")?.href

  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl">
      <div className="flex flex-col gap-2">
        <Typography variant="title">{translate["report.title"]()}</Typography>
        <Typography className="text-lg text-neutral-400">
          {translate["report.description"]()}
        </Typography>
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <Typography className="text-sm font-semibold">
          {translate["report.what-title"]()}
        </Typography>
        <ul className="flex flex-col gap-1 text-sm text-neutral-400 list-disc pl-5">
          <li>{translate["report.what-1"]()}</li>
          <li>{translate["report.what-2"]()}</li>
          <li>{translate["report.what-3"]()}</li>
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <Typography className="text-sm font-semibold text-neutral-300">
          {translate["report.contact-title"]()}
        </Typography>
        <div className="flex flex-col sm:flex-row gap-3">
          {discord && (
            <a href={discord} target="_blank" rel="noreferrer">
              <Button background="positive" className="w-full sm:w-fit h-11 font-semibold">
                {translate["report.discord"]()}
              </Button>
            </a>
          )}
          {telegram && (
            <a href={telegram} target="_blank" rel="noreferrer">
              <Button background="positive" className="w-full sm:w-fit h-11 font-semibold">
                {translate["report.telegram"]()}
              </Button>
            </a>
          )}
          <a href="/rules" className="text-green-400 font-semibold w-fit self-center">
            {translate["report.rules"]()}
          </a>
        </div>
      </div>
    </div>
  )
}, "ReportContent")

export default function Page() {
  return (
    <div className="flex flex-col gap-8 w-full h-full">
      <ReportContent />
    </div>
  )
}
