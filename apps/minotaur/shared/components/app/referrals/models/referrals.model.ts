import { env } from "@/shared/env";
import { client } from "@/shared/lib/client-wrapper";
import { atom, reatomAsync, withAssign, withCache, withDataAtom, withErrorAtom, withStatusesAtom } from "@reatom/framework";

type ReferralListPayload = ExtractApiData<"getServerReferralsList">["data"]

export type Referral = ReferralListPayload[number]

export type ReferralStats = {
  used: number;
  remaining: number;
  limit: number;
}

export type ReferralLink = ReferralStats & {
  token: string;
  expires_at: string;
}

export const referralLinkUrl = (token: string) => `${env.VITE_APP_URL}/auth?callback_query=${token}`

export const referrals = atom(null, "referrals").pipe(
  withAssign((_, name) => ({
    fetch: reatomAsync(async (ctx) => {
      return await ctx.schedule(() =>
        client.get("/server/referrals/list")
      )
    }, `${name}.fetch`).pipe(
      withDataAtom(null, (_, data) => data.length === 0 ? null : data),
      withCache({ swr: false }),
      withStatusesAtom(),
      withErrorAtom()
    ),
    stats: reatomAsync(async () => {
      return await client.raw.get<ReferralStats>("/server/referrals/me")
    }, `${name}.stats`).pipe(
      withDataAtom(null),
      withStatusesAtom(),
      withErrorAtom()
    ),
    createLink: reatomAsync(async () => {
      return await client.raw.post<ReferralLink>("/server/referrals/link")
    }, `${name}.createLink`).pipe(
      withDataAtom(null),
      withStatusesAtom(),
      withErrorAtom()
    ),
  }))
)
