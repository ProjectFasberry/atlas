import { reatomComponent } from "@reatom/npm-react"
import { socialsAtom } from "@/shared/models/shared.model"
import { translate } from "@/shared/locales/helpers"
import { Button } from "@/shared/ui/button"
import { Typography } from "@/shared/ui/typography"

const SupportContent = reatomComponent(({ ctx }) => {
  const socials = ctx.spy(socialsAtom)
  const telegram = socials.find((social) => social.value === "tg")?.href
  const discord = socials.find((social) => social.value === "ds")?.href

  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl">
      <Typography variant="title">{translate["support.title"]()}</Typography>
      <Typography className="text-lg text-neutral-400">
        {translate["support.description"]()}
      </Typography>

      <div className="flex flex-col sm:flex-row gap-3">
        {discord && (
          <a href={discord} target="_blank" rel="noreferrer">
            <Button background="positive" className="w-full sm:w-fit h-11 font-semibold">
              {translate["support.discord"]()}
            </Button>
          </a>
        )}
        {telegram && (
          <a href={telegram} target="_blank" rel="noreferrer">
            <Button background="positive" className="w-full sm:w-fit h-11 font-semibold">
              {translate["support.telegram"]()}
            </Button>
          </a>
        )}
        <a href="/contacts" target="_blank" rel="noreferrer">
          <Button background="default" className="w-full sm:w-fit h-11 font-semibold">
            {translate["support.contacts"]()}
          </Button>
        </a>
      </div>

      <div className="flex flex-col gap-2 rounded-xl bg-neutral-900 p-4">
        <Typography className="text-lg font-semibold">
          {translate["support.report-title"]()}
        </Typography>
        <Typography className="text-neutral-400">
          {translate["support.report-description"]()}
        </Typography>
        <a href="/rules" target="_blank" rel="noreferrer" className="text-green-400 font-semibold w-fit">
          {translate["support.rules"]()}
        </a>
      </div>
    </div>
  )
}, "SupportContent")

export default function Page() {
  return (
    <div className="flex flex-col gap-8 w-full h-full">
      <SupportContent />
    </div>
  )
}
