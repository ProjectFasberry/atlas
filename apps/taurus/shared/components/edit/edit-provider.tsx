import { createEffect, on, onMount } from "solid-js"
import { toast } from "solid-sonner"
import { reatomComponent } from "@/shared/lib/reatom"
import { useAtomAccessor } from "@/shared/lib/utils"
import { siteEdit, type EditContent, type EditPage } from "@/shared/models/site-edit.model"
import { hydrateSiteEditMode, setSiteEditMode, siteEditMode } from "@/shared/models/site-edit-mode.model"
import { translate } from "@/shared/locales/helpers"
import type { SiteLocale } from "@/shared/api/site"

/**
 * Client-side switch between published content and the editor's draft.
 *
 * Every editable page renders it once with a builder that turns the API
 * document into the editor state; the rest of the page only reads `siteEdit`.
 */
export const EditProvider = reatomComponent<{
  page: EditPage
  locale: SiteLocale
  canEdit: boolean
  canPublish: boolean
  build: (content: unknown) => EditContent
}>(({ ctx, page, locale, canEdit, canPublish, build }) => {
  const active = useAtomAccessor(siteEditMode.active)
  const draft = useAtomAccessor(siteEdit.loadDraft.dataAtom)
  const draftError = useAtomAccessor(siteEdit.loadDraft.errorAtom)

  onMount(() => hydrateSiteEditMode(ctx))

  const ready = () => draft()?.page === page && draft()?.locale === locale

  // Refetch whenever the editor turns edit mode on or switches page: another
  // editor may have saved meanwhile.
  createEffect(on([active, () => page, () => locale], ([enabled]) => {
    if (!enabled || !canEdit) return

    siteEdit.loadDraft(ctx, { page, locale })
  }, { defer: true }))

  createEffect(() => {
    if (!active() || !canEdit || !ready()) return

    const payload = draft()
    if (!payload) return

    siteEdit.init(ctx, {
      page,
      locale: payload.locale,
      version: payload.version,
      canPublish,
      content: build(payload.content),
    })
  })

  createEffect(() => {
    if (!draftError()) return

    toast.error(translate["edit.draft-error"]())
    setSiteEditMode(ctx, false)
  })

  createEffect(() => {
    if (active()) return

    siteEdit.close(ctx)
  })

  return null
}, "EditProvider")
