import { client } from "@/shared/lib/client-wrapper"
import { reatomAsync, withCache, withDataAtom, withErrorAtom, withStatusesAtom } from "@reatom/framework"
import { action, atom } from "@reatom/framework"
import { withAssign, withReset } from "@reatom/framework"
import { toast } from "sonner"
import { actions, notifyAboutRestrictRole } from "./actions.model"
import { alertDialog } from "@/shared/components/config/alert-dialog/alert-dialog.model"

export type BannerList = ExtractApiData<"getBannerList">["data"];
export type BannerSingle = BannerList["data"][number]

export const banners = atom(null, "banners").pipe(
  withAssign((_, name) => ({
    fetch: reatomAsync(async (ctx) => {
      return await ctx.schedule(() => client
        .get(`/banner/list`, { signal: ctx.controller.signal })
      )
    }, `${name}.fetch`).pipe(
      withDataAtom(null),
      withStatusesAtom(),
      withCache({ swr: false })
    )
  }))
)

export const createBannerState = atom(null, "createBannerState").pipe(
  withAssign((_, name) => ({
    title: atom("", `${name}.title`).pipe(withReset()),
    desc: atom("", `${name}.desc`).pipe(withReset()),
    hrefTitle: atom("", `${name}.hrefTitle`).pipe(withReset()),
    hrefValue: atom("", `${name}.hrefValue`).pipe(withReset())
  }))
)
export const createBanner = atom(null, "createBanner").pipe(
  withAssign((_, name) => ({
    resetFull: action((ctx) => {
      createBannerState.title.reset(ctx)
      createBannerState.desc.reset(ctx)
      createBannerState.hrefTitle.reset(ctx)
      createBannerState.hrefValue.reset(ctx)
    }),
    submit: reatomAsync(async (ctx) => {
      createBanner.submit.errorAtom.reset(ctx);

      const json: ExtractApiBody<"postPrivatedBannersCreate">["content"]["application/json"] = {
        title: ctx.get(createBannerState.title),
        description: ctx.get(createBannerState.desc),
        href: {
          title: ctx.get(createBannerState.hrefTitle),
          value: ctx.get(createBannerState.hrefValue)
        }
      }

      return await client
        .post("/privated/banners/create", {
          json
        })
    }, {
      name: `${name}.submit`,
      onFulfill: (ctx, res) => {
        banners.fetch.cacheAtom.reset(ctx)
        banners.fetch.dataAtom(ctx, (state) => state ? { data: [...state.data, res], meta: state.meta } : null);

        createBanner.resetFull(ctx)
        actions.goBack(ctx)

        toast.success("Баннер создан");
      },
      onReject: (_, e) => {
        notifyAboutRestrictRole(e)
      }
    }).pipe(
      withStatusesAtom(),
      withErrorAtom()
    )
  }))
)

export const deleteBanner = atom(null, "deleteBanner").pipe(
  withAssign((_, name) => ({
    deleteBefore: action((ctx, item: { id: number, title: string }) => {
      alertDialog.open(ctx, {
        title: `Вы точно хотите удалить "${item.title}"?`,
        onConfirm: () => deleteBanner.submit(ctx, item.id),
        errorAtom: deleteBanner.submit.errorAtom,
      });
    }, `${name}.deleteBefore`),
    submit: reatomAsync(async (_, id: number) => {
      const result = await client
        .delete("/privated/banners/{id}", { params: { path: { id } } })

      return { result, id }
    }, {
      name: `${name}.submit`,
      onFulfill: (ctx, res) => {
        banners.fetch.dataAtom(ctx, (state) => {
          if (!state) return null;

          return {
            data: state.data.filter(b => b.id !== res.id),
            meta: state.meta
          }
        })
      },
      onReject: (_, e) => {
        notifyAboutRestrictRole(e)
      }
    }).pipe(
      withStatusesAtom(),
      withErrorAtom()
    )
  }))
)
