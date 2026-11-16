import { client } from "@/shared/lib/client-wrapper"
import {
  atom, reatomAsync, reatomMap, withAssign, withCache, withDataAtom,
  withErrorAtom, withStatusesAtom,
} from "@reatom/framework"
import { toast } from "sonner"
import { translate } from "@/shared/locales/helpers"

export type SocialPayload = ExtractApiData<"getPrivatedSocialsList">["data"][number]

const socialsProcessing = reatomMap<string, boolean>()

export const getSocialIsUpdating = (value: string) => atom((ctx) =>
  ctx.spy(socialsProcessing).get(value) ?? false
)

export const socials = atom(null, "socials").pipe(
  withAssign((_, name) => ({
    fetch: reatomAsync(async (ctx) => {
      return await ctx.schedule(() => client.get("/privated/socials/list"))
    }, {
      name: `${name}.fetch`,
    }).pipe(
      withDataAtom([]),
      withCache({ swr: false }),
      withStatusesAtom(),
      withErrorAtom()
    ),
    update: reatomAsync(async (ctx, value: string, isAvailable: boolean) => {
      socialsProcessing.getOrCreate(ctx, value, () => true)

      try {
        return await client
          .post("/privated/socials/{value}/edit", {
            json: { isAvailable },
            params: { path: { value } },
          })
      } finally {
        socialsProcessing.delete(ctx, value)
      }
    }, {
      name: `${name}.update`,
      onFulfill: (ctx, res) => {
        socials.fetch.dataAtom(ctx, (state) =>
          state.map((social) => social.value === res.value ? res : social)
        )
        toast.success(translate["panel.socials-updated"]())
      },
      onReject: () => {
        toast.error(translate["panel.socials-update-error"]())
      },
    }).pipe(
      withStatusesAtom()
    )
  }))
)
