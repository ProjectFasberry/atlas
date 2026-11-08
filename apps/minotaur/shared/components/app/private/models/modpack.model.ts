import { alertDialog } from "@/shared/components/config/alert-dialog/alert-dialog.model";
import { client } from "@/shared/lib/client-wrapper";
import { action, atom, reatomAsync, withAssign, withCache, withErrorAtom, withReset, withStatusesAtom } from "@reatom/framework";
import { actions } from "./actions.model";

type Modpacks = ExtractApiData<"getModpackList">["data"]
type Modpack = Modpacks[number]

export const modpackState = atom(null, "modpackState").pipe(
  withAssign((_, name) => ({
    create: atom(null, `${name}.create`).pipe(
      withAssign((_, name) => ({
        downloadLink: atom("", `${name}.downloadLink`).pipe(withReset()),
        modpackName: atom("", `${name}.modpackName`).pipe(withReset()),
      }))
    ),
    data: atom<Modpacks | null>(null, `${name}.data`).pipe(withReset())
  }))
)

export const modpack = atom(null, "modpack").pipe(
  withAssign((_, name) => ({
    fetch: reatomAsync(async (ctx) => {
      return await ctx.schedule(() =>
        client.get("/modpack/list", { signal: ctx.controller.signal })
      )
    }, {
      name: `${name}.fetch`,
      onFulfill: (ctx, res) => {
        modpackState.data(ctx, res)
      }
    }).pipe(
      withStatusesAtom(),
      withErrorAtom(),
      withCache({ swr: false })
    ),
    create: reatomAsync(async (ctx) => {
      const json: ExtractApiBody<"postPrivatedModpacksCreate">["content"]["application/json"] = {
        downloadLink: ctx.get(modpackState.create.downloadLink),
        name: ctx.get(modpackState.create.modpackName),
      }

      return await client
        .post("/privated/modpacks/create", {
          json
        })

    }, {
      name: `${name}.create`,
      onFulfill: (ctx, res) => {
        modpackState.data(ctx, (state) => state ? [...state, res] : [res])

        modpackState.create.downloadLink.reset(ctx);
        modpackState.create.modpackName.reset(ctx);

        actions.goBack(ctx)
      }
    }).pipe(
      withStatusesAtom(),
      withErrorAtom()
    ),
    deleteBefore: action((ctx, id: Modpack["id"]) => {
      alertDialog.open(ctx, {
        title: `Удаление модпака`,
        description: `Вы точно хотите удалить этот модпак?`,
        onConfirm: () => modpack.delete(ctx, id),
        onClose: () => modpack.delete.errorAtom.reset(ctx),
        errorAtom: modpack.delete.errorAtom,
      })
    }),
    delete: reatomAsync(async (_, id: Modpack["id"]) => {
      const result = await client
        .delete("/privated/modpacks/{id}", { params: { path: { id } } })

      return { id, result }
    }, {
      name: `${name}.delete`,
      onFulfill: (ctx, res) => {
        modpackState.data(ctx, (state) => state
          ? state.filter((item) => item.id !== res.id)
          : state
        )
      }
    }).pipe(
      withStatusesAtom(),
      withErrorAtom()
    )
  }))
)
