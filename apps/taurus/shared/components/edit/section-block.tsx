import { Show } from "solid-js"
import { Dynamic } from "solid-js/web"
import { reatomComponent } from "@/shared/lib/reatom"
import { useAtomAccessor } from "@/shared/lib/utils"
import { siteEdit, type EditBlock } from "@/shared/models/site-edit.model"
import { EditableText } from "./editable-text"
import { Button } from "@/shared/ui/button"
import { Typography } from "@/shared/ui/typography"
import { translate } from "@/shared/locales/helpers"

/**
 * Overrides for the built-in sections. The state keeps only what an editor
 * changed; every component passes its translated copy as the fallback.
 */
function useBlockState(id: string) {
  const editing = useAtomAccessor(siteEdit.active)
  const content = useAtomAccessor(siteEdit.content)
  const published = useAtomAccessor(siteEdit.publishedBlocks)

  const override = (): EditBlock =>
    (editing() ? content()?.blocks?.[id] : published()[id]) ?? {}

  return { editing, override }
}

/** True only for visitors: editors keep seeing the hidden section to unhide it. */
export function useBlockHidden(id: string) {
  const { editing, override } = useBlockState(id)

  return () => Boolean(override().hidden) && !editing()
}

export const BlockTitle = reatomComponent<{
  id: string
  fallback: string
  class?: string
  as?: "h1" | "h2" | "h3"
}>(({ ctx, id, fallback, class: className, as }) => {
  const { editing, override } = useBlockState(id)
  const value = () => override().title ?? fallback

  return (
    <Show
      when={editing()}
      fallback={
        <Dynamic component={as ?? "h2"} class={className}>
          {value()}
        </Dynamic>
      }
    >
      <EditableText
        class={className}
        value={value()}
        onInput={(next) => siteEdit.setBlock(ctx, id, { title: next })}
      />
    </Show>
  )
}, "SectionBlockTitle")

export const BlockSubtitle = reatomComponent<{
  id: string
  fallback: string
  class?: string
}>(({ ctx, id, fallback, class: className }) => {
  const { editing, override } = useBlockState(id)
  const value = () => override().description ?? fallback

  return (
    <Show
      when={editing()}
      fallback={
        <Typography color="gray" class={className}>
          {value()}
        </Typography>
      }
    >
      <EditableText
        multiline
        class={className}
        value={value()}
        onInput={(next) => siteEdit.setBlock(ctx, id, { description: next })}
      />
    </Show>
  )
}, "SectionBlockSubtitle")

/** Hide/unhide a built-in section; rendered only in edit mode. */
export const BlockControls = reatomComponent<{ id: string }>(({ ctx, id }) => {
  const { editing, override } = useBlockState(id)

  return (
    <Show when={editing()}>
      <div class="flex items-center gap-2">
        <Button
          class="px-2 py-1 text-[11px]"
          onClick={() => siteEdit.toggleBlock(ctx, id)}
        >
          {override().hidden ? translate["edit.show-section"]() : translate["edit.hide-section"]()}
        </Button>
        <Show when={override().hidden}>
          <span class="text-[11px] text-neutral-400">{translate["edit.section-hidden"]()}</span>
        </Show>
      </div>
    </Show>
  )

  }, "SectionBlockControls")
