import { reatomComponent, useUpdate } from "@reatom/npm-react";
import { referrals, type Referral } from "../models/referrals.model";
import { Avatar } from "@/shared/ui/avatar";
import { Link } from "@/shared/components/config/link/link";
import { Skeleton } from "@/shared/ui/skeleton";
import { Typography } from "@/shared/ui/typography";
import { ErrorBlock } from "@/shared/ui/error-block";
import { createLink } from "@/shared/components/config/link/link.model";
import { dayjs } from "@/shared/lib/dayjs";
import { translate } from "@/shared/locales/helpers"

const ReferralCard = reatomComponent<Referral>(({
  ctx, completed, created_at, referral
}) => {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl bg-neutral-900 p-3">
      <Link href={createLink("player", referral.nickname)} className="shrink-0">
        <Avatar nickname={referral.nickname} url={referral.avatar} className="size-9" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <Link
          href={createLink("player", referral.nickname)}
          className="truncate text-sm font-semibold hover:text-neutral-100"
        >
          {referral.nickname}
        </Link>
        <span className="text-[11px] text-neutral-500">
          {dayjs(created_at).format("D MMM YYYY")}
        </span>
      </div>
      <span
        className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium ${
          completed ? "bg-green-500/15 text-green-300" : "bg-neutral-800 text-neutral-400"
        }`}
      >
        {completed
          ? translate["referrals.list.completed"]()
          : translate["referrals.list.in-progress"]()
        }
      </span>
    </div>
  )
}, "ReferralCard")

const ReferralsSkeleton = () => (
  <div className="grid w-full gap-2 sm:grid-cols-2 xl:grid-cols-3">
    {Array.from({ length: 3 }).map((_, index) => (
      <Skeleton key={index} className="h-16 w-full rounded-xl" />
    ))}
  </div>
)

export const ReferralsList = reatomComponent(({ ctx }) => {
  useUpdate(referrals.fetch, [])

  if (ctx.spy(referrals.fetch.statusesAtom).isPending) {
    return <ReferralsSkeleton />
  }

  const error = ctx.spy(referrals.fetch.errorAtom)
  if (error) return <ErrorBlock title={error.message} />

  const data = ctx.spy(referrals.fetch.dataAtom)
  if (!data) {
    return (
      <div className="flex w-full flex-col items-center
        gap-2 rounded-xl bg-neutral-900 p-6 text-center">
        <Typography className="text-sm font-semibold">
          {translate["referrals.list.empty"]()}
        </Typography>
        <Typography className="max-w-sm text-xs text-neutral-400">
          {translate["referrals.list.empty-hint"]()}
        </Typography>
      </div>
    )
  }

  return (
    <div className="grid w-full gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {data.map((referral) => (
        <ReferralCard key={referral.id} {...referral} />
      ))}
    </div>
  )
}, "ReferralsList")
