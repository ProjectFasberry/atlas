import { action, atom, reatomAsync, withDataAtom, withErrorAtom, withStatusesAtom } from "@reatom/framework"
import type { JSONContent } from "@tiptap/react"
import { toast } from "sonner"
import { client } from "@/shared/lib/client-wrapper"
import { logError } from "@/shared/lib/log"
import { translate } from "@/shared/locales/helpers"

export type RuleRow = {
  id: number
  category: string
  content: JSONContent
  created_at: string
  updated_at: string | null
}

const rowsAtom = atom<RuleRow[] | null>(null, "rulesPanel.rows")
const selectedAtom = atom<number | null>(null, "rulesPanel.selected")
const categoryAtom = atom("", "rulesPanel.category")
const contentAtom = atom<JSONContent>({}, "rulesPanel.content")
const dirtyAtom = atom(false, "rulesPanel.dirty")

const fetch = reatomAsync(async (ctx) => {
  return await ctx.schedule(() => client.raw.get<RuleRow[]>("/privated/rules/list"))
}, {
  name: "rulesPanel.fetch",
  onFulfill: (ctx, rows) => {
    rowsAtom(ctx, rows)

    const current = ctx.get(selectedAtom)
    const next = rows.find((row) => row.id === current) ?? rows[0]

    if (next) {
      selectedAtom(ctx, next.id)
      categoryAtom(ctx, next.category)
      contentAtom(ctx, next.content)
      dirtyAtom(ctx, false)
    }
  },
  onReject: (_, error) => logError(error, { type: "combined" }),
}).pipe(withDataAtom(null), withStatusesAtom(), withErrorAtom())

const select = action((ctx, row: RuleRow) => {
  selectedAtom(ctx, row.id)
  categoryAtom(ctx, row.category)
  contentAtom(ctx, row.content)
  dirtyAtom(ctx, false)
}, "rulesPanel.select")

const setCategory = action((ctx, value: string) => {
  categoryAtom(ctx, value)
  dirtyAtom(ctx, true)
}, "rulesPanel.setCategory")

const setContent = action((ctx, value: JSONContent) => {
  contentAtom(ctx, value)
  dirtyAtom(ctx, true)
}, "rulesPanel.setContent")

const save = reatomAsync(async (ctx) => {
  const id = ctx.get(selectedAtom)
  if (!id) return null

  return await ctx.schedule(() => client.raw.put<RuleRow>(`/privated/rules/${id}`, {
    json: { category: ctx.get(categoryAtom), content: ctx.get(contentAtom) },
  }))
}, {
  name: "rulesPanel.save",
  onFulfill: (ctx, row) => {
    if (!row) return

    const rows = ctx.get(rowsAtom) ?? []
    rowsAtom(ctx, rows.map((item) => item.id === row.id ? row : item))
    dirtyAtom(ctx, false)
    toast.success(translate["panel.rules-saved"]())
  },
  onReject: (_, error) => {
    logError(error, { type: "combined" })
    toast.error(translate["panel.rules-save-error"]())
  },
}).pipe(withStatusesAtom())

export const rulesPanel = {
  rows: rowsAtom,
  selected: selectedAtom,
  category: categoryAtom,
  content: contentAtom,
  dirty: dirtyAtom,
  fetch,
  select,
  setCategory,
  setContent,
  save,
}
