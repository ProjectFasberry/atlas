import { getStaticImage } from "@/shared/lib/helpers"
import { PageHeaderImage } from "@/shared/ui/header-image"
import { Typography } from "@/shared/ui/typography"
import { ReferralsLink } from "@/shared/components/app/referrals/components/referrals"
import { ReferralsList } from "@/shared/components/app/referrals/components/referrals-list"
import { translate } from "@/shared/locales/helpers"

const referalsImage = getStaticImage("images/emotes-preview.webp")

export default function Page() {
  return (
    <div className="flex flex-col gap-6 w-full min-w-0 h-full">
      <PageHeaderImage img={referalsImage} />
      <div className="flex flex-col gap-4 min-w-0 w-full h-full">
        <div className="flex flex-col gap-1">
          <Typography className="text-2xl font-semibold sm:text-3xl">
            {translate["referrals.card.title"]()}
          </Typography>
          <Typography className="max-w-2xl text-sm text-neutral-400">
            {translate["referrals.card.description"]()}
          </Typography>
        </div>
        <ReferralsLink />
        <ReferralsList />
      </div>
    </div>
  )
}
