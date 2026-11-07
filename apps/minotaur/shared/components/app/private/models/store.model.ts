import { storeItemCreateSchema } from '@/shared/schemas/store';
import { logError } from "@/shared/lib/log";
import { action, atom, type AtomState, batch, withErrorAtom } from "@reatom/framework";
import { reatomAsync, reatomRecord, withAssign, withCache, withDataAtom, withReset, withStatusesAtom } from "@reatom/framework";
import { getStoreItems, type StoreItemsParams } from "../../shop/models/store.model";
import { client, withJsonBody } from "@/shared/lib/client-wrapper";
import { toast } from "sonner";
import { notifyAboutRestrictRole } from "./actions.model";
import { alertDialog } from "@/shared/components/config/alert-dialog/alert-dialog.model";
import * as z from "zod";
import type { JSONContent } from "@tiptap/react";
import { navigate } from "vike/client/router";
import { type StoreItem } from '../../shop/models/store-item.model';

type CreateItemStoreSchema = z.infer<typeof storeItemCreateSchema>

export const createStoreItemState = atom(null, "createStoreItemState").pipe(
  withAssign((_, name) => ({
    title: atom<CreateItemStoreSchema["title"]>("", `${name}.title`).pipe(withReset()),
    imgUrl: atom<Nullable<CreateItemStoreSchema["imageUrl"]>>(null, `${name}.imgUrl`).pipe(withReset()),
    currency: atom<CreateItemStoreSchema["currency"]>("CHARISM", `${name}.currency`).pipe(withReset()),
    value: atom<Nullable<CreateItemStoreSchema["value"]>>(null, `${name}.value`).pipe(withReset()),
    content: atom<JSONContent>({}, `${name}.content`).pipe(withReset()),
    price: atom<CreateItemStoreSchema["price"]>("0", `${name}.price`).pipe(withReset()),
    command: atom<CreateItemStoreSchema["command"]>("", `${name}.command`).pipe(withReset()),
    refundCmd: atom<Nullable<CreateItemStoreSchema["refund_cmd"]>>(null, `${name}.refundCmd`).pipe(withReset()),
    type: atom<Nullable<CreateItemStoreSchema["type"]>>(null, `${name}.type`).pipe(withReset())
  }))
)
export const createStoreItem = atom(null, "createStoreItem").pipe(
  withAssign((_, name) => ({
    resetFull: action((ctx) => {
      createStoreItemState.title.reset(ctx)
      createStoreItemState.imgUrl.reset(ctx)
      createStoreItemState.currency.reset(ctx)
      createStoreItemState.value.reset(ctx)
      createStoreItemState.content.reset(ctx)
      createStoreItemState.price.reset(ctx)
      createStoreItemState.command.reset(ctx)
      createStoreItemState.refundCmd.reset(ctx)
      createStoreItemState.type.reset(ctx)
    }),
    submit: reatomAsync(async (ctx) => {
      const body = {
        title: ctx.get(createStoreItemState.title),
        imageUrl: ctx.get(createStoreItemState.imgUrl),
        value: ctx.get(createStoreItemState.value),
        currency: ctx.get(createStoreItemState.currency),
        content: ctx.get(createStoreItemState.content),
        price: ctx.get(createStoreItemState.price),
        command: ctx.get(createStoreItemState.command),
        refund_cmd: ctx.get(createStoreItemState.refundCmd),
        type: ctx.get(createStoreItemState.type)
      }

      return await client
        .post<StoreItem>("privated/store/item/create")
        .pipe(withJsonBody(body))
        .exec()
    }, {
      name: `${name}.submit`,
      onFulfill: (ctx, res) => {
        toast.success("Товар создан");

        batch(ctx, () => {
          storeItems.fetch.cacheAtom.reset(ctx);
          storeItems.fetch(ctx)
        })

        createStoreItem.resetFull(ctx)

        ctx.schedule(() => navigate("/private/store"))
      },
      onReject: (_, e) => {
        notifyAboutRestrictRole(e)
        logError(e, { type: "combined" })
      }
    }).pipe(
      withStatusesAtom()
    )
  }))
)

export const deleteStoreItem = atom(null, "deleteStoreItem").pipe(
  withAssign((_, name) => ({
    before: action((ctx, item: StoreItem) => {
      alertDialog.open(ctx, {
        title: `Вы точно хотите удалить товар "${item.title}"?`,
        onConfirm: () => deleteStoreItem.submit(ctx, item.id),
        errorAtom: deleteStoreItem.submit.errorAtom,
      });
    }),
    submit: reatomAsync(async (ctx, id: number) => {
      return await client
        .delete<{ id: number }>(`privated/store/item/${id}`)
        .exec()
    }, {
      name: `${name}.submit`,
      onFulfill: (ctx, res) => {
        toast.success("Товар удален");

        storeItems.fetch.cacheAtom.reset(ctx);
        storeItems.fetch(ctx)
      },
      onReject: (_, e) => logError(e, { type: "combined" })
    }).pipe(
      withStatusesAtom(),
      withErrorAtom()
    )
  }))
)

export const itemToEditAtom = atom<StoreItem | null>(null).pipe(withReset())

export const editStoreItemState = atom(null, "editStoreItemState").pipe(
  withAssign((_, name) => ({
    title: atom<string>("", `${name}.title`),
    description: atom<string | null>(null, `${name}.description`),
    imageUrl: atom<string>("", `${name}.imageUrl`),
    currency: atom<string>("CHARISM", `${name}.currency`),
    value: atom<string>("", `${name}.value`),
    content: atom<JSONContent>({}, `${name}.content`),
    price: atom<string>("0", `${name}.price`),
    command: atom<string>("", `${name}.command`),
    refundCmd: atom<string | null>(null, `${name}.refundCmd`),
    type: atom<string>("event", `${name}.type`)
  }))
)

export const editStoreItem = atom(null, "editStoreItem").pipe(
  withAssign((_, name) => ({
    load: action((ctx, item: StoreItem) => {
      editStoreItemState.title(ctx, item.title)
      editStoreItemState.description(ctx, item.description ?? null)
      editStoreItemState.imageUrl(ctx, item.imageUrl)
      editStoreItemState.currency(ctx, item.currency)
      editStoreItemState.value(ctx, item.value)
      editStoreItemState.content(ctx, (item.content ?? {}) as JSONContent)
      editStoreItemState.price(ctx, String(item.price))
      editStoreItemState.command(ctx, item.command ?? "")
      editStoreItemState.refundCmd(ctx, item.refund_cmd ?? null)
      editStoreItemState.type(ctx, item.type)
    }),
    submit: reatomAsync(async (ctx, id: number) => {
      const body = [
        { field: "title", value: ctx.get(editStoreItemState.title) },
        { field: "description", value: ctx.get(editStoreItemState.description) },
        { field: "imageUrl", value: ctx.get(editStoreItemState.imageUrl) },
        { field: "type", value: ctx.get(editStoreItemState.type) },
        { field: "command", value: ctx.get(editStoreItemState.command) },
        { field: "refund_cmd", value: ctx.get(editStoreItemState.refundCmd) },
        { field: "value", value: ctx.get(editStoreItemState.value) },
        { field: "currency", value: ctx.get(editStoreItemState.currency) },
        { field: "price", value: Number(ctx.get(editStoreItemState.price)) },
        { field: "content", value: ctx.get(editStoreItemState.content) },
      ]

      return await client
        .post(`privated/store/item/edit/${id}`)
        .pipe(withJsonBody(body))
        .exec()
    }, {
      name: `${name}.submit`,
      onFulfill: (ctx) => {
        toast.success("Товар обновлён");
        storeItems.fetch.cacheAtom.reset(ctx);
        storeItems.fetch(ctx);
        ctx.schedule(() => navigate("/private/store"));
      },
      onReject: (_, e) => logError(e, { type: "combined" })
    }).pipe(
      withStatusesAtom()
    )
  }))
)

export const storeState = atom(null, "storeState").pipe(
  withAssign((_, name) => ({
    searchParams: reatomRecord<Record<string, string>>({}, `${name}.searchParams`),
    searchParamTarget: atom<"create" | "edit" | "view">("view", `${name}.searchParamTarget`),
    category: atom<StoreItemsParams["category"]>("all", `${name}.category`),
    wallet: atom<StoreItemsParams["wallet"]>("ALL", `${name}.wallet`)
  }))
)
export const storeItems = atom(null, "storeItems").pipe(
  withAssign((_, name) => ({
    fetch: reatomAsync(async (ctx) => {
      const params: StoreItemsParams = {
        category: ctx.get(storeState.category),
        wallet: ctx.get(storeState.wallet),
        searchQuery: ""
      }

      return await ctx.schedule(() => getStoreItems(params))
    }, {
      name: `${name}.fetch`,
      onReject: (_, e) => logError(e, { type: "combined" })
    }).pipe(
      withDataAtom(null),
      withStatusesAtom(),
      withCache({ swr: false }),
      withErrorAtom()
    )
  }))
)

storeState.searchParams.onChange(async (ctx, state) => {
  const target = state["target"] as AtomState<typeof storeState.searchParamTarget> | undefined;
  storeState.searchParamTarget(ctx, target ?? "view");

  if (target === 'edit') {
    const id = Number(state["id"]);

    // The public store list does not expose command/refund_cmd. The private
    // GET returns the full item for the edit form.
    const item = await client
      .get<StoreItem>(`privated/store/item/${id}`)
      .exec()
      .catch(() => null);

    if (!item) {
      throw new Error('Товар не найден')
    }

    itemToEditAtom(ctx, item)
  }
})
