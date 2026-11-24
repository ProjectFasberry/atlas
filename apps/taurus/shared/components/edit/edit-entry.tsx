import { Show } from "solid-js"
import { translate } from "@/shared/locales/helpers"
import { reatomComponent } from "@/shared/lib/reatom"
import { useAtomAccessor } from "@/shared/lib/utils"
import { siteEdit } from "@/shared/models/site-edit.model"
import { setSiteEditMode } from "@/shared/models/site-edit-mode.model"

/** Staff entry into edit mode; hidden from everyone else. */
export const EditEntry = reatomComponent<{ canEdit: boolean }>(({ ctx, canEdit }) => {
  const active = useAtomAccessor(siteEdit.active)

  return (
  <Show when={canEdit && !active()}>
    <button
      type="button"
      class="button fixed right-3 bottom-3 z-40 px-3 py-1.5 text-xs text-neutral-50"
      onClick={() => setSiteEditMode(ctx, true)}
    >
      {translate["edit.enter"]()}
    </button>
  </Show>
  )
}, "EditEntry")
