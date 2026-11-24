import type { JSONContent } from "@tiptap/core"
import { dayjs } from "@/shared/lib/create-dayjs"
import { translate } from "@/shared/locales/helpers"

export type RawCategory = {
  category?: string
  content?: JSONContent
  updated_at?: string | null
}

export type RuleCategory = {
  id: string
  title: string
  blocks: JSONContent[]
  count: number
  updatedAt?: string | null
}

export const textOf = (node?: JSONContent | null): string => {
  if (!node) return ""
  if (node.type === "text") return node.text ?? ""

  return (node.content ?? []).map(textOf).join(" ")
}

/**
 * The API stores some categories as one paragraph with several numbered rules
 * glued together (`1.1. ... 1.2. ...`). Split those into separate paragraphs so
 * the reader gets one rule per line.
 */
const splitDenseParagraph = (block: JSONContent): JSONContent[] => {
  if (block.type !== "paragraph") return [block]

  const text = textOf(block)
  const parts = text.split(/(?=\d+\.\d+\.)/).map((part) => part.trim()).filter(Boolean)

  if (parts.length <= 1) return [block]

  return parts.map((part) => ({
    type: "paragraph",
    content: [{ type: "text", text: part }]
  }))
}

const toBlocks = (doc?: JSONContent): JSONContent[] => {
  if (!Array.isArray(doc?.content)) return []
  return doc.content.flatMap(splitDenseParagraph)
}

export const normalize = (raw: RawCategory[]): RuleCategory[] => raw.map((item, index) => {
  const blocks = toBlocks(item.content)

  return {
    id: `rules-${index}`,
    title: item.category ?? "",
    blocks,
    count: blocks.length,
    updatedAt: item.updated_at
  }
})

export const pointsLabel = (count: number) => {
  const mod10 = count % 10
  const mod100 = count % 100

  if (mod10 === 1 && mod100 !== 11) return translate["rules.points.one"]()
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return translate["rules.points.few"]()

  return translate["rules.points.many"]()
}

export const getUpdatedDate = (categories: RuleCategory[]): string | null => {
  const times = categories
    .map((category) => category.updatedAt)
    .filter((value): value is string => !!value)
    .map((value) => new Date(value).getTime())
    .filter(Number.isFinite)

  if (!times.length) return null

  return dayjs(Math.max(...times)).format("DD.MM.YYYY")
}
