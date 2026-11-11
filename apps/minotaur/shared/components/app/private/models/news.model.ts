import * as z from "zod";
import { action, atom, withErrorAtom, type AtomMut } from "@reatom/framework";
import { reatomAsync, withAssign, withCache, withDataAtom, withReset, withStatusesAtom } from "@reatom/framework";
import { createNewsSchema, newsUpdateSchema } from "@/shared/schemas/news";
import { toast } from "sonner";
import { client } from "@/shared/lib/client-wrapper";
import { generateHTML, type JSONContent } from "@tiptap/react"
import { actions, actionsState, collectChanges, compareChanges, notifyAboutRestrictRole } from "./actions.model";
import { alertDialog } from "@/shared/components/config/alert-dialog/alert-dialog.model";
import { editorExtensions } from "@/shared/components/config/editor/editor.model";
import { env } from "@/shared/env";

export type NewsPayload = ExtractApiData<"getNewsList">["data"]
export type NewsSingle = NewsPayload["data"][number];

export const newsList = {
  fetch: reatomAsync(async (ctx) => {
    return await ctx.schedule(() => client.raw
      .get<NewsPayload>("/privated/news/list", {
        signal: ctx.controller.signal,
        params: {
          query: {
            asc: false,
            content: true
          }
        }
      })
    )
  }, `newsList.fetch`).pipe(
    withDataAtom(null),
    withStatusesAtom(),
    withCache({ swr: false }),
    withErrorAtom()
  )
}

export type NewsImageVariant = "input-url" | "null"

/** Image source picker state for the news editor. */
export const newsImageVariant = atom<NewsImageVariant>("null", "newsImageVariant")

export const createNewsState = atom(null, "createNewsState").pipe(
  withAssign((_, name) => ({
    title: atom("", `${name}.title`).pipe(withReset()),
    desc: atom("", `${name}.description`).pipe(withReset()),
    imageUrl: atom(null, `${name}.imageUrl`).pipe(
      withAssign((_, name) => ({
        data: atom("", `${name}.imageUrl`).pipe(withReset()),
        isError: atom(false, `${name}.isError`).pipe(withReset()),
        isLoading: atom(false, `${name}.isLoading`).pipe(withReset()),
        isOpen: atom(false, `${name}.isOpen`).pipe(withReset()),
        ref: atom<HTMLInputElement | null>(null, `${name}.ref`).pipe(withReset())
      }))
    ),
    content: atom<JSONContent | null>(null, `${name}.content`).pipe(withReset()),
    tempContent: atom<string>("", `${name}.tempContent`).pipe(withReset())
  }))
)
export const createNewsStateFullImageUrlAtom = atom((ctx) =>
  `${env.VITE_VOLUME_URL}/${ctx.spy(createNewsState.imageUrl.data)}`
);

export const createNews = atom(null, "createNews").pipe(
  withAssign((_, name) => ({
    resetFull: action((ctx) => {
      createNewsState.title.reset(ctx)
      createNewsState.desc.reset(ctx)
      createNewsState.imageUrl.data.reset(ctx)
      createNewsState.content.reset(ctx)
      createNewsState.tempContent.reset(ctx)
      newsImageVariant(ctx, "null")
    }),
    isValid: atom((ctx) =>
      createNewsSchema.safeParse({
        title: ctx.spy(createNewsState.title),
        description: ctx.spy(createNewsState.desc),
        imageUrl: ctx.spy(createNewsState.imageUrl),
        content: ctx.spy(createNewsState.content),
      }).success
    ),
    imageUrl: atom(null).pipe(
      withAssign(() => ({
        submit: action((ctx, e: React.FormEvent<HTMLFormElement>) => {
          e.preventDefault()

          createNewsState.imageUrl.isError(ctx, false);
          createNewsState.imageUrl.isLoading(ctx, true);

          const target = ctx.get(createNewsState.imageUrl.ref)
          if (!target) return;

          if (["https://", "http://"].some((prefix) => target.value.startsWith(prefix))) {
            createNewsState.imageUrl.data(ctx, target.value)
          } else {
            createNewsState.imageUrl.isError(ctx, true)
          }
        }),
        handleOpen: action((ctx, open: boolean) => {
          if (open) {
            const isLoading = ctx.get(createNewsState.imageUrl.isLoading)
            const isError = ctx.get(createNewsState.imageUrl.isError)
            if (isLoading || isError) return;
            createNewsState.imageUrl.isOpen(ctx, true)
          } else {
            createNewsState.imageUrl.isOpen(ctx, false)
          }
        }),
        setupRef: action((ctx, el: HTMLInputElement | null) => {
          if (el) createNewsState.imageUrl.ref(ctx, el)

          return () => {
            createNewsState.imageUrl.ref.reset(ctx)
          }
        })
      }))
    ),
    contentIsValid: atom((ctx) =>
      ctx.spy(createNewsState.tempContent).length >= 1, `${name}.contentIsValid`
    ),
    saveContent: action((ctx, json: JSONContent) => {
      createNewsState.content(ctx, json);
    }),
    submit: reatomAsync(async (ctx) => {
      const json = {
        title: ctx.get(createNewsState.title),
        description: ctx.get(createNewsState.desc),
        imageUrl: ctx.get(createNewsState.imageUrl.data),
        content: ctx.get(createNewsState.content)
      }

      return await client.raw
        .post<NewsSingle>("/privated/news/create", { json })
    }, {
      name: `${name}.submit`,
      onFulfill: (ctx, res) => {
        toast.success("Новость создана")

        newsList.fetch.cacheAtom.reset(ctx)
        newsList.fetch.dataAtom(ctx, (state) => state
          ? { data: [...state.data, res], meta: state.meta }
          : null
        )

        createNews.resetFull(ctx);

        actions.goBack(ctx)
      },
      onReject: (_, e) => notifyAboutRestrictRole(e)
    }).pipe(
      withStatusesAtom(),
      withErrorAtom()
    )
  }))
)

export const editNewsState = atom(null, "editNewsState").pipe(
  withAssign((_, name) => ({
    title: atom<string>('', `${name}.title`).pipe(withReset()),
    description: atom<string>('', `${name}.description`).pipe(withReset()),
    content: atom<JSONContent | null>(null, `${name}.content`).pipe(withReset()),
    imageUrl: atom<string>('', `${name}.imageUrl`).pipe(withReset()),
    tempContent: atom<string>('', `${name}.tempContent`).pipe(withReset())
  }))
)

const editFormAtoms: Record<string, AtomMut<any>> = {
  title: editNewsState.title,
  description: editNewsState.description,
  content: editNewsState.content,
  imageUrl: editNewsState.imageUrl,
  tempContent: editNewsState.tempContent,
}

/** Id the form was filled from, so a list refetch does not overwrite user edits. */
const editNewsSourceId = atom<Nullable<number>>(null, "editNews.sourceId")

/** Selected news, resolved from the already loaded list. */
const editNewsItemAtom = atom((ctx): NewsSingle | null => {
  const id = ctx.spy(actionsState.target)
  if (!id) return null

  const targets = ctx.spy(newsList.fetch.dataAtom)?.data
  if (!targets) {
    ctx.schedule(() => newsList.fetch(ctx))
    return null
  }

  return targets.find((target) => target.id === Number(id)) ?? null
}, "editNews.item")


const editNewsContentIsValidAtom = atom(
  (ctx) => ctx.spy(editNewsState.tempContent).trim().length >= 1,
  "editNews.contentIsValid",
)

const editNewsIsValidAtom = atom((ctx) => {
  const item = ctx.spy(editNewsItemAtom)
  if (!item) return false

  return compareChanges(
    {
      title: ctx.spy(editNewsState.title),
      description: ctx.spy(editNewsState.description),
      content: ctx.spy(editNewsState.content),
      imageUrl: ctx.spy(editNewsState.imageUrl),
    },
    {
      title: item.title,
      description: item.description,
      content: item.content,
      imageUrl: item.imageUrl ?? "",
    },
  )
}, "editNews.isValid")

export const editNews = atom(null, "editNews").pipe(
  withAssign((_, name) => ({
    item: editNewsItemAtom,
    /** The editor applies content on its own; gate only on something being typed. */
    contentIsValid: editNewsContentIsValidAtom,
    isValid: editNewsIsValidAtom,
    getOldValues: action((ctx) => {
      const item = ctx.get(editNewsItemAtom)
      if (!item) return {}

      return {
        title: item.title,
        description: item.description,
        content: item.content as JSONContent,
        imageUrl: item.imageUrl ?? "",
      }
    }),
    getValues: action((ctx) => ({
      title: ctx.get(editNewsState.title),
      description: ctx.get(editNewsState.description),
      content: ctx.get(editNewsState.content),
      imageUrl: ctx.get(editNewsState.imageUrl),
    })),
    resetFull: action((ctx) => {
      editNewsState.title.reset(ctx)
      editNewsState.description.reset(ctx)
      editNewsState.imageUrl.reset(ctx)
      editNewsState.content.reset(ctx)
      editNewsState.tempContent.reset(ctx)
    }),
    updateField: action((ctx, key: keyof typeof editFormAtoms, value: any) => {
      const fieldAtom = editFormAtoms[key]
      if (!fieldAtom) return
      fieldAtom(ctx, value)
    }),
    saveContent: action((ctx, json: JSONContent) => {
      editNewsState.content(ctx, json);
    }),
    /** Copies the item into the form once per id; refetches keep user edits. */
    fill: action((ctx, item: NewsSingle) => {
      if (item.id === ctx.get(editNewsSourceId)) return

      editNewsSourceId(ctx, item.id)
      editNewsState.title(ctx, item.title)
      editNewsState.description(ctx, item.description)
      editNewsState.content(ctx, item.content as JSONContent)
      editNewsState.imageUrl(ctx, item.imageUrl ?? "")
      editNewsState.tempContent(ctx, generateHTML(item.content as JSONContent, editorExtensions))
    }),
    /** Clears the form and the fill marker, so the next open starts from the item. */
    reset: action((ctx) => {
      editNewsSourceId(ctx, null)
      editNewsState.title.reset(ctx)
      editNewsState.description.reset(ctx)
      editNewsState.imageUrl.reset(ctx)
      editNewsState.content.reset(ctx)
      editNewsState.tempContent.reset(ctx)
    }),
    submit: reatomAsync(async (ctx) => {
      const id = ctx.get(actionsState.target);

      const changes = collectChanges(
        editNews.getValues(ctx),
        editNews.getOldValues(ctx)
      )

      const body = Object.entries(changes).map(([field, value]) => ({ field, value })) as z.infer<typeof newsUpdateSchema>

      const result = await client.raw
        .post<ExtractApiData<"postPrivatedNewsByIdEdit">["data"]>(`/privated/news/${id}/edit`, {
          json: body
        })

      return result
    }, {
      name: "editNewsAction",
      onFulfill: (ctx, result) => {
        editNews.resetFull(ctx);

        newsList.fetch.cacheAtom.reset(ctx)
        newsList.fetch.dataAtom(ctx, (state) => {
          if (!state) return null;

          const newArr = state.data.map((item) => item.id === result.id ? { ...result, views: 0 } : item)

          return {
            data: newArr,
            meta: state.meta
          }
        });

        actions.goBack(ctx)
      },
      onReject: (_, e) => notifyAboutRestrictRole(e)
    }).pipe(
      withStatusesAtom(),
      withErrorAtom()
    )
  }))
)

export const deleteNews = atom(null, "deleteNews").pipe(
  withAssign((_, name) => ({
    deleteBefore: action((ctx, item: { id: number, title: string }) => {
      alertDialog.open(ctx, {
        title: `Вы точно хотите удалить "${item.title}"?`,
        onConfirm: () => deleteNews.submit(ctx, item.id),
        errorAtom: deleteNews.submit.errorAtom,
      });
    }),
    submit: reatomAsync(async (_, id: number) => {
      const result = await client.raw
        .delete<ExtractApiData<"deletePrivatedNewsById">["data"]>(`/privated/news/${id}`)

      return { result, id }
    }, {
      name: `${name}.submit`,
      onFulfill: (ctx, res) => {
        if (!res) return;

        const { id } = res;

        newsList.fetch.cacheAtom.reset(ctx)
        newsList.fetch.dataAtom(ctx, (state) => state
          ? { data: state.data.filter(news => news.id !== id), meta: state.meta }
          : null
        );

        toast.success("Новость удалена")
      },
      onReject: (_, e) => notifyAboutRestrictRole(e, { withToast: false })
    }).pipe(
      withStatusesAtom(),
      withErrorAtom()
    )
  }))
)
