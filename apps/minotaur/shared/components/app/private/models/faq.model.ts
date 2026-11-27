import { action, atom, reatomAsync, withErrorAtom, withStatusesAtom } from "@reatom/framework"
import { toast } from "sonner"
import { client } from "@/shared/lib/client-wrapper"
import { alertDialog } from "@/shared/components/config/alert-dialog/alert-dialog.model"
import { logError } from "@/shared/lib/log"
import { translate } from "@/shared/locales/helpers"
import type { paths } from "@/shared/types/gen/api/main.schema"

export type FaqScope = "home" | "modpack" | "support"
export type FaqLocale = "ru" | "en"

type FaqList = paths["/privated/faq/list"]["get"]["responses"][200]["content"]["application/json"]["data"]
export type FaqRow = FaqList[number]
type FaqCreate = paths["/privated/faq/create"]["post"]["requestBody"]["content"]["application/json"]
type FaqUpdate = paths["/privated/faq/{id}"]["patch"]["requestBody"]["content"]["application/json"]

export const FAQ_SCOPES: FaqScope[] = ["home", "modpack", "support"]
export const FAQ_LOCALES: FaqLocale[] = ["ru", "en"]

export type FaqDraft = {
  question: string
  answer: string
  linkLabel: string
  linkHref: string
  published: boolean
}

export const EMPTY_FAQ_DRAFT: FaqDraft = {
  question: "",
  answer: "",
  linkLabel: "",
  linkHref: "",
  published: true,
}

const toDraft = (row: FaqRow): FaqDraft => ({
  question: row.question,
  answer: row.answer,
  linkLabel: row.linkLabel ?? "",
  linkHref: row.linkHref ?? "",
  published: row.published,
})

const scopeAtom = atom<FaqScope>("home", "faqPanel.scope")
const localeAtom = atom<FaqLocale>("ru", "faqPanel.locale")
const rowsAtom = atom<FaqRow[] | null>(null, "faqPanel.rows")
const draftsAtom = atom<Record<string, FaqDraft>>({}, "faqPanel.drafts")
const creatingAtom = atom(false, "faqPanel.creating")
const newDraftAtom = atom<FaqDraft>(EMPTY_FAQ_DRAFT, "faqPanel.newDraft")

const fetch = reatomAsync(async (ctx) => {
  return await client.get("/privated/faq/list", {
    params: { query: { scope: ctx.get(scopeAtom), locale: ctx.get(localeAtom) } },
    signal: ctx.controller.signal,
  })
}, {
  name: "faqPanel.fetch",
  onFulfill: (ctx, rows) => {
    rowsAtom(ctx, rows)
    draftsAtom(ctx, Object.fromEntries(rows.map((row) => [row.id, toDraft(row)])))
  },
  onReject: (_, error) => logError(error, { type: "combined" }),
}).pipe(withStatusesAtom(), withErrorAtom())

const create = reatomAsync(async (ctx, payload: FaqCreate) => {
  return await client.post("/privated/faq/create", { json: payload, signal: ctx.controller.signal })
}, {
  name: "faqPanel.create",
  onFulfill: (ctx) => {
    toast.success(translate["panel.faq-saved"]())
    fetch(ctx)
  },
  onReject: (_, error) => {
    logError(error, { type: "combined" })
    toast.error(translate["panel.faq-save-error"]())
  },
}).pipe(withStatusesAtom())

const update = reatomAsync(async (ctx, params: { id: string; payload: FaqUpdate }) => {
  return await client.patch("/privated/faq/{id}", {
    params: { path: { id: params.id } },
    json: params.payload,
    signal: ctx.controller.signal,
  })
}, {
  name: "faqPanel.update",
  onFulfill: (ctx) => {
    toast.success(translate["panel.faq-saved"]())
    fetch(ctx)
  },
  onReject: (_, error) => {
    logError(error, { type: "combined" })
    toast.error(translate["panel.faq-save-error"]())
  },
}).pipe(withStatusesAtom())

const remove = reatomAsync(async (ctx, id: string) => {
  return await client.delete("/privated/faq/{id}", {
    params: { path: { id } },
    signal: ctx.controller.signal,
  })
}, {
  name: "faqPanel.remove",
  onFulfill: (ctx) => {
    toast.success(translate["panel.faq-deleted"]())
    fetch(ctx)
  },
  onReject: (_, error) => {
    logError(error, { type: "combined" })
    toast.error(translate["panel.faq-delete-error"]())
  },
}).pipe(withStatusesAtom())

const setScope = action((ctx, value: FaqScope) => {
  scopeAtom(ctx, value)
  rowsAtom(ctx, null)
  draftsAtom(ctx, {})
  fetch(ctx)
}, "faqPanel.setScope")

const setLocale = action((ctx, value: FaqLocale) => {
  localeAtom(ctx, value)
  rowsAtom(ctx, null)
  draftsAtom(ctx, {})
  fetch(ctx)
}, "faqPanel.setLocale")

const editDraft = action((ctx, id: string, patch: Partial<FaqDraft>) => {
  const drafts = ctx.get(draftsAtom)
  draftsAtom(ctx, {
    ...drafts,
    [id]: { ...(drafts[id] ?? EMPTY_FAQ_DRAFT), ...patch },
  })
}, "faqPanel.editDraft")

const saveDraft = action((ctx, id: string) => {
  const draft = ctx.get(draftsAtom)[id]
  if (!draft) return

  update(ctx, {
    id,
    payload: {
      question: draft.question.trim(),
      answer: draft.answer.trim(),
      linkLabel: draft.linkLabel.trim() || null,
      linkHref: draft.linkHref.trim() || null,
      published: draft.published,
    },
  })
}, "faqPanel.saveDraft")

const startCreate = action((ctx) => {
  newDraftAtom(ctx, EMPTY_FAQ_DRAFT)
  creatingAtom(ctx, true)
}, "faqPanel.startCreate")

const cancelCreate = action((ctx) => {
  creatingAtom(ctx, false)
  newDraftAtom(ctx, EMPTY_FAQ_DRAFT)
}, "faqPanel.cancelCreate")

const editNewDraft = action((ctx, patch: Partial<FaqDraft>) => {
  newDraftAtom(ctx, { ...ctx.get(newDraftAtom), ...patch })
}, "faqPanel.editNewDraft")

const deleteBefore = action((ctx, row: FaqRow) => {
  alertDialog.open(ctx, {
    title: translate["panel.confirm-delete"]({ title: row.question }),
    onConfirm: () => remove(ctx, row.id),
  })
}, "faqPanel.deleteBefore")

const submitCreate = action((ctx) => {
  const draft = ctx.get(newDraftAtom)
  if (!draft.question.trim() || !draft.answer.trim()) return

  create(ctx, {
    scope: ctx.get(scopeAtom),
    locale: ctx.get(localeAtom),
    question: draft.question.trim(),
    answer: draft.answer.trim(),
    published: draft.published,
  })
  creatingAtom(ctx, false)
  newDraftAtom(ctx, EMPTY_FAQ_DRAFT)
}, "faqPanel.submitCreate")

export const faqPanel = {
  scope: scopeAtom,
  locale: localeAtom,
  rows: rowsAtom,
  drafts: draftsAtom,
  creating: creatingAtom,
  newDraft: newDraftAtom,
  fetch,
  create,
  update,
  remove,
  setScope,
  setLocale,
  deleteBefore,
  editDraft,
  saveDraft,
  startCreate,
  cancelCreate,
  editNewDraft,
  submitCreate,
}
