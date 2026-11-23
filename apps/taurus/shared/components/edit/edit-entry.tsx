import { Show } from "solid-js"
import { usePageContext } from "vike-solid/usePageContext"
import { translate } from "@/shared/locales/helpers"

/** Staff entry into edit mode; hidden from everyone else. */
export const EditEntry = (props: { active: boolean, canEdit: boolean }) => {
  const pageCtx = usePageContext()

  return (
    <Show when={props.canEdit && !props.active}>
      {/* Full reload: the draft lives in the request data, not in a client cache. */}
      <button
        type="button"
        class="button fixed right-3 bottom-3 z-40 px-3 py-1.5 text-xs text-neutral-50"
        onClick={() => {
          window.location.href = `${pageCtx.urlPathname}?edit=1`
        }}
      >
        {translate["edit.enter"]()}
      </button>
    </Show>
  )
}
