import { client, withJsonBody } from "@/shared/lib/client-wrapper";
import { reatomAsync, withCache, withDataAtom, withErrorAtom, withStatusesAtom } from "@reatom/framework";
import { action, atom } from "@reatom/framework";
import { actions, compareChanges, notifyAboutRestrictRole } from "./actions.model";
import { withAssign, withReset } from "@reatom/framework";
import { withUndo } from '@reatom/undo'
import { alertDialog } from "@/shared/components/config/alert-dialog/alert-dialog.model";
import { isEmptyArray } from "@/shared/lib/utils";

export type DictionariesItem = {
  value: string;
  created_at: string;
  id: number;
  key: string;
}

export const dictState = atom(null, "dictState").pipe(
  withAssign((_, name) => ({
    editId: atom<Nullable<number>>(null, `${name}.editId`).pipe(withReset()),
    editKey: atom<Nullable<string>>(null, `${name}.editKey`).pipe(withReset(), withUndo({ length: 200 })),
    editValue: atom<Nullable<string>>(null, `${name}.editValue`).pipe(withReset(), withUndo({ length: 200 })),
    createKey: atom<string>("", `${name}.createKey`).pipe(withReset()),
    createValue: atom<string>("", `${name}.createValue`).pipe(withReset())
  }))
)

export const dictionariesEdit = atom(null, "dictionariesEdit").pipe(
  withAssign((_, name) => ({
    start: action((ctx, id: number) => {
      const target = ctx.get(dict.fetchList.dataAtom)?.find(d => d.id === id)
      if (!target) throw new Error("Target is not defined")

      dictState.editId(ctx, target.id);
      dictState.editKey(ctx, target.key)
      dictState.editValue(ctx, target.value)
    }),
    resetFull: action((ctx) => {
      dictState.editId.reset(ctx)
      dictState.editKey.reset(ctx)
      dictState.editValue.reset(ctx);
    }),
    getIsEdit: (id: number) => atom((ctx) => ctx.spy(dictState.editId) === id),
    isValid: atom((ctx) => {
      const payload = {
        key: ctx.spy(dictState.editKey),
        value: ctx.spy(dictState.editValue)
      }

      const old = {
        key: ctx.get(dictState.editKey.historyAtom)[1],
        value: ctx.get(dictState.editValue.historyAtom)[1]
      }

      return compareChanges(payload, old)
    }),
  }))
)

export const dict = atom(null, "dict").pipe(
  withAssign((_, name) => ({
    fetchList: reatomAsync(async (ctx) => {
      return await ctx.schedule(() => client
        .get<ExtractApiData<"getPrivatedDictionariesList">["data"]>("privated/dictionaries/list", {
          signal: ctx.controller.signal
        })
        .exec()
      )
    }, {
      name: `${name}.fetchList`
    }).pipe(
      withDataAtom(null, (_, data) => isEmptyArray(data) ? null : data),
      withStatusesAtom(),
      withCache({ swr: false }),
      withErrorAtom()
    ),
    create: reatomAsync(async (ctx) => {
      const json = {
        key: ctx.get(dictState.createKey),
        value: ctx.get(dictState.createValue)
      }

      return await client
        .post<ExtractApiData<"postPrivatedDictionariesCreate">["data"]>("privated/dictionaries/create")
        .pipe(withJsonBody(json))
        .exec()
    }, {
      name: `${name}.create`,
      onFulfill: (ctx, res) => {
        dictState.createKey.reset(ctx)
        dictState.createValue.reset(ctx);

        dict.fetchList.dataAtom(ctx, (state) => state ? [...state, res] : [res]);

        actions.goBack(ctx)
      },
      onReject: (_, e) => notifyAboutRestrictRole(e)
    }).pipe(
      withStatusesAtom(),
      withErrorAtom()
    ),
    edit: reatomAsync(async (ctx, id: number) => {
      const json = {
        key: ctx.get(dictState.editKey),
        value: ctx.get(dictState.editValue)
      }

      return await client
        .post<ExtractApiData<"postPrivatedDictionariesByIdEdit">["data"]>(`privated/dictionaries/${id}/edit`)
        .pipe(withJsonBody(json))
        .exec()
    }, {
      name: `${name}.edit`,
      onFulfill: (ctx, res) => {
        dictionariesEdit.resetFull(ctx)
        dict.fetchList.dataAtom(ctx, (state) => state ? state.filter(s => s.id !== res.id) : [])
      },
      onReject: (_, e) => notifyAboutRestrictRole(e)
    }).pipe(
      withStatusesAtom(),
      withErrorAtom()
    ),
    deleteBefore: action((ctx, item: { id: number, title: string }) => {
      alertDialog.open(ctx, {
        title: `Вы точно хотите удалить "${item.title}"?`,
        onConfirm: () => dict.delete(ctx, item.id),
        errorAtom: dict.delete.errorAtom,
      });
    }, `${name}.deleteBefore`),
    delete: reatomAsync(async (ctx, id: number) => {
      const result = await client
        .delete<ExtractApiData<"deletePrivatedDictionariesByIdRemove">['data']>(`privated/dictionaries/${id}/remove`)
        .exec()

      return { result, id };
    }, {
      name: `${name}.delete`,
      onFulfill: (ctx, { result, id }) => {
        if (result === 'OK') {
          dict.fetchList.dataAtom(ctx, (state) => state ? state.filter(s => s.id !== id) : [])
        }
      },
      onReject: (ctx, e) => notifyAboutRestrictRole(e)
    }).pipe(
      withStatusesAtom(),
      withErrorAtom()
    ),
  }))
)
