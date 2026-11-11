import { Typography } from "@/shared/ui/typography"
import { translate } from "@/shared/locales/helpers"
import { JoinForm } from "@/shared/components/app/join/components/join-form"

export default function Page() {
  return (
    <div className="flex flex-col gap-6 w-full h-full py-4">
      <div className="flex flex-col gap-2 max-w-3xl">
        <Typography variant="title">{translate["team.join.title"]()}</Typography>
        <Typography className="text-lg text-neutral-400">
          {translate["team.join.description"]()}
        </Typography>
      </div>
      <JoinForm />
    </div>
  )
}
