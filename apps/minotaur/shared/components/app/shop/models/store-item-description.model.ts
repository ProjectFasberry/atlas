import { atom } from "@reatom/framework"
import type { JSONContent } from "@tiptap/react"
import { editorExtensions } from "@/shared/components/config/editor/editor.model"
import { normalizeTiptapContent, renderTiptapContent } from "@/shared/lib/tiptap-content"
import { storeItemState } from "./store-item.model"

/** Rich description HTML for the store item page; kept out of the global layout graph. */
export const selectedDonateDataAtom = atom((ctx) => {
  const data = ctx.spy(storeItemState.data)
  if (!data) return null

  const rawData = normalizeTiptapContent(data.content)
  const isExpanded = ctx.spy(storeItemState.isExpanded)

  const content = isExpanded ? rawData : { ...rawData, content: rawData.content?.slice(0, 1) }

  return renderTiptapContent(content, editorExtensions)
})
