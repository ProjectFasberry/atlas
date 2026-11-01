import { reatomComponent, useUpdate } from "@reatom/npm-react";
import { referrals, type Referral } from "../models/referrals.model";
import { Noop } from "@/shared/ui/noop";
import { Avatar } from "@/shared/ui/avatar";
import { Link } from "@/shared/components/config/link/link";
import { PageLoader } from "@/shared/ui/page-loader";
import { Typography } from "@/shared/ui/typography";
import { ErrorBlock } from "@/shared/ui/error-block";
import { createLink } from "@/shared/components/config/link/link.model";

const ReferralListItem = reatomComponent<Referral>(({
  ctx, completed, created_at, id, referral
}) => {
  return (
    <div className="flex flex-col flex-1 min-w-0 p-4 h-22 gap-2 border border-neutral-800 rounded-lg">
      <div className="flex items-center gap-2">
        <Link href={createLink("player", referral.nickname)}>
          <Avatar
            nickname={referral.nickname}
            url={referral.avatar}
            className="h-6 w-6"
          />
        </Link>
        <Link href={createLink("player", referral.nickname)}>
          {referral.nickname}
        </Link>
      </div>
      <div className="flex items-center gap-1 min-w-0">
        <Typography>
          Статус:
        </Typography>
        <Typography
          data-state={completed}
          className="data-[state=true]:text-green-500 truncate data-[state=false]:text-neutral-400"
        >
          {completed ? "завершен" : "в процессе"}
        </Typography>
      </div>
    </div>
  )
}, "ReferralListItem")

export const ReferralsList = reatomComponent(({ ctx }) => {
  useUpdate(referrals.fetch, [])

  if (ctx.spy(referrals.fetch.statusesAtom).isPending) return <PageLoader />

  const error = ctx.spy(referrals.fetch.errorAtom)
  if (error) return <ErrorBlock title={error.message} />

  const data = ctx.spy(referrals.fetch.dataAtom)
  if (!data) return <Noop />

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 w-full">
      {data.map((referral) => (
        <ReferralListItem key={referral.id} {...referral} />
      ))}
    </div>
  )
}, "ReferralsList")
