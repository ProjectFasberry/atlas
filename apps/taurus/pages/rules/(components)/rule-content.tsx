import { createMemo } from "solid-js"
import { renderToHTMLString } from "@tiptap/static-renderer"
import type { JSONContent } from "@tiptap/core"
import { editorExtensions as extensions } from "@/shared/components/editor.model"
import { translate } from "@/shared/locales/helpers"

/** Renders tiptap JSON and adds per-rule anchors so a rule can be linked. */
export const RuleHtml = (props: { blocks: JSONContent[] }) => {
  const html = createMemo(() => {
    const raw = renderToHTMLString({
      extensions,
      content: { type: "doc", content: props.blocks }
    })

    return raw
      .replace(/<p>(\d+(?:\.\d+)*)\./g, (_match, code: string) => {
        const id = `rule-${code.replace(/\./g, "-")}`
        return `<p id="${id}" class="rule-line">${code}.`
      })
      .replace(
        /<p id="(rule-[^"]+)"([^>]*)>([\s\S]*?)<\/p>/g,
        (_match, id: string, attrs: string, inner: string) =>
          `<p id="${id}"${attrs}>${inner}<a class="rule-anchor" href="#${id}" aria-label="${translate["rules.anchor"]()}">#</a></p>`
      )
  })

  return (
    <div
      class="tiptap rules-content whitespace-pre-wrap"
      innerHTML={html()}
    />
  )
}
