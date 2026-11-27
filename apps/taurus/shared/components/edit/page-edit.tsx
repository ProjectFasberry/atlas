import { Show, type Accessor } from "solid-js"
import { reatomComponent } from "@/shared/lib/reatom"
import { useAtomAccessor } from "@/shared/lib/utils"
import { siteEdit, type EditContent, type EditPage } from "@/shared/models/site-edit.model"
import { asBlocks, asSectionsContent } from "@/shared/api/site"
import { EditableSections } from "./editable-sections"
import { EditEntry } from "./edit-entry"
import { EditToolbar } from "./edit-toolbar"

type PageEditProps = {
  /** Published document of the page (`content`, or `sections` for modpack). */
  content: unknown
  page: EditPage
  /** Document kind this page edits, so a draft from another page never leaks. */
  kind: EditContent["kind"]
  canEdit?: boolean
  editing: Accessor<boolean>
}

/**
 * Editable tail shared by every landing page: custom sections, the staff entry
 * and the toolbar. Keeps the per-page files down to their actual content.
 */
export const PageEdit = reatomComponent<PageEditProps>(({ ctx, ...props }) => {
  const draft = useAtomAccessor(siteEdit.content)

  siteEdit.setPublishedBlocks(ctx, asBlocks(props.content))

  const sections = () => {
    const content = draft()
    return props.editing() && content?.kind === props.kind && ctx.get(siteEdit.page) === props.page
      ? content.sections
      : asSectionsContent(props.content)
  }

  return (
    <>
      <EditableSections
        sections={sections()}
        editing={props.editing()}
      />
      <EditEntry canEdit={Boolean(props.canEdit)} />
      <Show when={props.editing()}>
        <EditToolbar />
      </Show>
    </>
  )
}, "PageEdit")
