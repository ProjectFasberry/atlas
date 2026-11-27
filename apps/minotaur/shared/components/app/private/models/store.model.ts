import { storeItemCreateSchema } from '@/shared/schemas/store';
import { logError } from "@/shared/lib/log";
import { action, atom, type AtomState, batch, withErrorAtom } from "@reatom/framework";
import { reatomAsync, reatomRecord, sleep, withAssign, withCache, withConcurrency, withDataAtom, withReset, withStatusesAtom } from "@reatom/framework";
import { type StoreItemsPayload } from "../../shop/models/store.model";
import { client } from "@/shared/lib/client-wrapper";
import { toast } from "sonner";
import { notifyAboutRestrictRole } from "./actions.model";
import { alertDialog } from "@/shared/components/config/alert-dialog/alert-dialog.model";
import * as z from "zod";
import type { JSONContent } from "@tiptap/react";
import { navigate } from "vike/client/router";
import { translate } from "@/shared/locales/helpers"
import { type StoreItem } from '../../shop/models/store-item.model';

type CreateItemStoreSchema = z.infer<typeof storeItemCreateSchema>

export type AdminStoreItemsParams = {
  category: "all" | "donate" | "event"
  wallet: "ALL" | "CHARISM" | "BELKOIN"
  searchQuery?: string
  endCursor?: string
}

/** The panel list carries the same payload as the shop, with an admin page size. */
async function getAdminStoreItems(params: AdminStoreItemsParams) {
  return client.raw.get<StoreItemsPayload>("/privated/store/item/list", {
    params: { query: params },
  })
}

type StoreItemsPage = NonNullable<StoreItemsPayload>

export const createStoreItemState = atom(null, "createStoreItemState").pipe(
  withAssign((_, name) => ({
    title: atom<CreateItemStoreSchema["title"]>("", `${name}.title`).pipe(withReset()),
    description: atom<Nullable<CreateItemStoreSchema["description"]>>(null, `${name}.description`).pipe(withReset()),
    imgUrl: atom<Nullable<CreateItemStoreSchema["imageUrl"]>>(null, `${name}.imgUrl`).pipe(withReset()),
    imageUploading: atom(false, `${name}.imageUploading`),
    imageError: atom<Nullable<string>>(null, `${name}.imageError`),
    currency: atom<CreateItemStoreSchema["currency"]>("CHARISM", `${name}.currency`).pipe(withReset()),
    value: atom<Nullable<CreateItemStoreSchema["value"]>>(null, `${name}.value`).pipe(withReset()),
    content: atom<JSONContent>({}, `${name}.content`).pipe(withReset()),
    price: atom<CreateItemStoreSchema["price"]>("0", `${name}.price`).pipe(withReset()),
    command: atom<CreateItemStoreSchema["command"]>("", `${name}.command`).pipe(withReset()),
    refundCmd: atom<Nullable<CreateItemStoreSchema["refund_cmd"]>>(null, `${name}.refundCmd`).pipe(withReset()),
    type: atom<CreateItemStoreSchema["type"]>("donate", `${name}.type`).pipe(withReset())
  }))
)
export const createStoreItemBodyAtom = atom((ctx) => ({
  title: ctx.spy(createStoreItemState.title),
  description: ctx.spy(createStoreItemState.description),
  imageUrl: ctx.spy(createStoreItemState.imgUrl),
  value: ctx.spy(createStoreItemState.value) ?? "",
  currency: ctx.spy(createStoreItemState.currency),
  content: ctx.spy(createStoreItemState.content),
  price: ctx.spy(createStoreItemState.price),
  command: ctx.spy(createStoreItemState.command),
  refund_cmd: ctx.spy(createStoreItemState.refundCmd),
  type: ctx.spy(createStoreItemState.type),
}), "createStoreItemBody")

/** Field-level errors for the create form; the API validates again. */
export const createStoreItemValidationAtom = atom((ctx) => {
  const result = storeItemCreateSchema.safeParse(ctx.spy(createStoreItemBodyAtom))
  const errors: Record<string, string> = {}

  if (!result.success) {
    for (const issue of result.error.issues) {
      const key = String(issue.path[0] ?? "")
      if (key && !errors[key]) errors[key] = issue.message
    }
  }

  return { valid: result.success, errors }
}, "createStoreItemValidation")

export const createStoreItem = atom(null, "createStoreItem").pipe(
  withAssign((_, name) => ({
    resetFull: action((ctx) => {
      createStoreItemState.title.reset(ctx)
      createStoreItemState.description.reset(ctx)
      createStoreItemState.imgUrl.reset(ctx)
      createStoreItemState.imageUploading(ctx, false)
      createStoreItemState.imageError(ctx, null)
      createStoreItemState.currency.reset(ctx)
      createStoreItemState.value.reset(ctx)
      createStoreItemState.content.reset(ctx)
      createStoreItemState.price.reset(ctx)
      createStoreItemState.command.reset(ctx)
      createStoreItemState.refundCmd.reset(ctx)
      createStoreItemState.type.reset(ctx)
    }),
    uploadImage: reatomAsync(async (ctx, file: File) => {
      const form = new FormData()
      form.append("file", file)

      return await client.post("/privated/store/item/image", {
        body: form
      })
    }, {
      name: `${name}.uploadImage`,
      onFulfill: (ctx, result) => {
        createStoreItemState.imgUrl(ctx, result.key)
        createStoreItemState.imageError(ctx, null)
      },
      onReject: (ctx, error) => {
        createStoreItemState.imageError(ctx, error instanceof Error ? error.message : translate["panel.could-not-load-the-image"]())
        logError(error, { type: "combined" })
      }
    }).pipe(
      withStatusesAtom()
    ),
    submit: reatomAsync(async (ctx) => {
      return await client.raw.post<StoreItem>("/privated/store/item/create", {
        json: ctx.get(createStoreItemBodyAtom)
      })
    }, {
      name: `${name}.submit`,
      onFulfill: (ctx, res) => {
        toast.success(translate["panel.item-created"]());

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

export const duplicateStoreItem = reatomAsync(async (_, id: number) => {
  return await client.raw.get<StoreItem>("/privated/store/item/{id}", {
    params: { path: { id } }
  })
}, {
  name: "duplicateStoreItem",
  onFulfill: (ctx, item) => {
    if (!item) return

    createStoreItemState.title(ctx, translate["panel.copy-suffix"]({ title: item.title }))
    createStoreItemState.description(ctx, item.description ?? null)
    createStoreItemState.imgUrl(ctx, item.imageUrl ?? null)
    createStoreItemState.currency(ctx, item.currency as AtomState<typeof createStoreItemState.currency>)
    createStoreItemState.value(ctx, item.value)
    createStoreItemState.content(ctx, (item.content ?? {}) as JSONContent)
    createStoreItemState.price(ctx, String(item.price))
    createStoreItemState.command(ctx, item.command ?? "")
    createStoreItemState.refundCmd(ctx, item.refund_cmd ?? null)
    createStoreItemState.type(ctx, item.type)

    ctx.schedule(() => navigate("/private/store?target=create"))
  },
  onReject: (_, e) => {
    logError(e, { type: "combined" })
    toast.error(translate["panel.could-not-open-the-item"]())
  }
}).pipe(
  withStatusesAtom()
)

export const deleteStoreItem = atom(null, "deleteStoreItem").pipe(
  withAssign((_, name) => ({
    before: action((ctx, item: StoreItem) => {
      alertDialog.open(ctx, {
        title: translate["panel.confirm-delete"]({ title: item.title }),
        onConfirm: () => deleteStoreItem.submit(ctx, item.id),
        errorAtom: deleteStoreItem.submit.errorAtom,
      });
    }),
    submit: reatomAsync(async (ctx, id: number) => {
      return await client
        .delete("/privated/store/item/{id}", { params: { path: { id } } })
    }, {
      name: `${name}.submit`,
      onFulfill: (ctx, res) => {
        toast.success(translate["panel.item-deleted"]());

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

export const editStoreItemAttemptedAtom = atom(false, "editStoreItemAttempted")

export const editStoreItemState = atom(null, "editStoreItemState").pipe(
  withAssign((_, name) => ({
    title: atom<string>("", `${name}.title`),
    description: atom<string | null>(null, `${name}.description`),
    imageUrl: atom<string>("", `${name}.imageUrl`),
    imageUploading: atom(false, `${name}.imageUploading`),
    imageError: atom<string | null>(null, `${name}.imageError`),
    currency: atom<string>("CHARISM", `${name}.currency`),
    value: atom<string>("", `${name}.value`),
    content: atom<JSONContent>({}, `${name}.content`),
    price: atom<string>("0", `${name}.price`),
    command: atom<string>("", `${name}.command`),
    refundCmd: atom<string | null>(null, `${name}.refundCmd`),
    type: atom<string>("event", `${name}.type`)
  }))
)

export const editStoreItemBodyAtom = atom((ctx) => ({
  title: ctx.spy(editStoreItemState.title),
  description: ctx.spy(editStoreItemState.description),
  imageUrl: ctx.spy(editStoreItemState.imageUrl) || null,
  value: ctx.spy(editStoreItemState.value),
  currency: ctx.spy(editStoreItemState.currency),
  content: ctx.spy(editStoreItemState.content),
  price: ctx.spy(editStoreItemState.price),
  command: ctx.spy(editStoreItemState.command),
  refund_cmd: ctx.spy(editStoreItemState.refundCmd),
  type: ctx.spy(editStoreItemState.type),
}), "editStoreItemBody")

/** Same rules as the create form; the API validates the field list again. */
export const editStoreItemValidationAtom = atom((ctx) => {
  const result = storeItemCreateSchema.safeParse(ctx.spy(editStoreItemBodyAtom))
  const errors: Record<string, string> = {}

  if (!result.success) {
    for (const issue of result.error.issues) {
      const key = String(issue.path[0] ?? "")
      if (key && !errors[key]) errors[key] = issue.message
    }
  }

  return { valid: result.success, errors }
}, "editStoreItemValidation")

export const editStoreItem = atom(null, "editStoreItem").pipe(
  withAssign((_, name) => ({
    load: action((ctx, item: StoreItem) => {
      editStoreItemState.title(ctx, item.title)
      editStoreItemState.description(ctx, item.description ?? null)
      editStoreItemState.imageUrl(ctx, item.imageUrl)
      editStoreItemState.imageUploading(ctx, false)
      editStoreItemState.imageError(ctx, null)
      editStoreItemState.currency(ctx, item.currency)
      editStoreItemState.value(ctx, item.value)
      editStoreItemState.content(ctx, (item.content ?? {}) as JSONContent)
      editStoreItemState.price(ctx, String(item.price))
      editStoreItemState.command(ctx, item.command ?? "")
      editStoreItemState.refundCmd(ctx, item.refund_cmd ?? null)
      editStoreItemState.type(ctx, item.type)
      editStoreItemAttemptedAtom(ctx, false)
    }),
    uploadImage: reatomAsync(async (ctx, file: File) => {
      const form = new FormData()
      form.append("file", file)

      return await client.post("/privated/store/item/image", {
        body: form
      })
    }, {
      name: `${name}.uploadImage`,
      onFulfill: (ctx, result) => {
        editStoreItemState.imageUrl(ctx, result.key)
        editStoreItemState.imageError(ctx, null)
      },
      onReject: (ctx, error) => {
        editStoreItemState.imageError(ctx, error instanceof Error ? error.message : translate["panel.could-not-load-the-image"]())
        logError(error, { type: "combined" })
      }
    }).pipe(
      withStatusesAtom()
    ),
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

      return await client.raw
        .post(`/privated/store/item/${id}/edit`, { json: body })
    }, {
      name: `${name}.submit`,
      onFulfill: (ctx) => {
        toast.success(translate["panel.item-updated"]());
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
    category: atom<AdminStoreItemsParams["category"]>("all", `${name}.category`),
    wallet: atom<AdminStoreItemsParams["wallet"]>("ALL", `${name}.wallet`),
    searchQuery: atom("", `${name}.searchQuery`)
  }))
)
export const storeItems = atom(null, "storeItems").pipe(
  withAssign((_, name) => ({
    fetch: reatomAsync(async (ctx) => {
      const params: AdminStoreItemsParams = {
        category: ctx.get(storeState.category),
        wallet: ctx.get(storeState.wallet),
        searchQuery: ctx.get(storeState.searchQuery).trim() || undefined
      }

      return await ctx.schedule(() => getAdminStoreItems(params))
    }, {
      name: `${name}.fetch`,
      onReject: (_, e) => logError(e, { type: "combined" })
    }).pipe(
      withDataAtom(null),
      withStatusesAtom(),
      withCache({ swr: false }),
      withErrorAtom()
    ),
    loadMore: reatomAsync(async (ctx): Promise<StoreItemsPage | null> => {
      const current: StoreItemsPage | null = ctx.get(storeItems.fetch.dataAtom)
      if (!current?.meta?.hasNextPage || !current.meta.endCursor) return null

      return await getAdminStoreItems({
        category: ctx.get(storeState.category),
        wallet: ctx.get(storeState.wallet),
        searchQuery: ctx.get(storeState.searchQuery).trim() || undefined,
        endCursor: current.meta.endCursor
      })
    }, {
      name: `${name}.loadMore`,
      onFulfill: (ctx, page: StoreItemsPage | null) => {
        if (!page) return

        const current: StoreItemsPage | null = ctx.get(storeItems.fetch.dataAtom)
        if (!current) return

        storeItems.fetch.dataAtom(ctx, {
          data: [...current.data, ...page.data],
          meta: page.meta
        })
      },
      onReject: (_, e) => logError(e, { type: "combined" })
    }).pipe(
      withStatusesAtom()
    ),
    search: action(async (ctx, value: string) => {
      storeState.searchQuery(ctx, value)
      await sleep(250)
      storeItems.fetch(ctx)
    }).pipe(withConcurrency()),
    setCategory: action((ctx, value: AdminStoreItemsParams["category"]) => {
      storeState.category(ctx, value)
      storeItems.fetch(ctx)
    }),
    setWallet: action((ctx, value: AdminStoreItemsParams["wallet"]) => {
      storeState.wallet(ctx, value)
      storeItems.fetch(ctx)
    }),
    resetFilters: action((ctx) => {
      storeState.category(ctx, "all")
      storeState.wallet(ctx, "ALL")
      storeState.searchQuery(ctx, "")
      storeItems.fetch(ctx)
    })
  }))
)

storeState.searchParams.onChange(async (ctx, state) => {
  const target = state["target"] as AtomState<typeof storeState.searchParamTarget> | undefined;
  storeState.searchParamTarget(ctx, target ?? "view");

  if (target === 'edit') {
    const id = Number(state["id"]);

    // The public store list does not expose command/refund_cmd. The private
    // GET returns the full item for the edit form.
    const item = await client.raw
      .get<StoreItem>("/privated/store/item/{id}", { params: { path: { id } } })
      .catch(() => null);

    if (!item) {
      throw new Error(translate["panel.item-not-found"]())
    }

    itemToEditAtom(ctx, item)
  }
})
