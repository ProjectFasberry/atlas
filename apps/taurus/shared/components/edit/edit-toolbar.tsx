import { onCleanup, onMount, Show } from "solid-js"
import { Button } from "@/shared/ui/button"
import { reatomComponent } from "@/shared/lib/reatom"
import { useAtomAccessor } from "@/shared/lib/utils"
import { siteEdit } from "@/shared/models/site-edit.model"
import { setSiteEditMode } from "@/shared/models/site-edit-mode.model"
import { translate } from "@/shared/locales/helpers"

/** Fixed panel shown on every page with edit mode enabled. */
export const EditToolbar = reatomComponent(({ ctx }) => {
  const active = useAtomAccessor(siteEdit.active)
  const version = useAtomAccessor(siteEdit.version)
  const dirty = useAtomAccessor(siteEdit.dirty)
  const canPublish = useAtomAccessor(siteEdit.canPublish)
  const saving = useAtomAccessor(siteEdit.save.statusesAtom)
  const publishing = useAtomAccessor(siteEdit.publish.statusesAtom)
  const canUndo = useAtomAccessor(siteEdit.canUndo)
  const canRedo = useAtomAccessor(siteEdit.canRedo)

  const busy = () => saving().isPending || publishing().isPending

  onMount(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!active() || !(event.metaKey || event.ctrlKey)) return

      const key = event.key.toLowerCase()
      if (key !== "z" && key !== "y") return

      event.preventDefault()

      if (key === "y" || event.shiftKey) siteEdit.redo(ctx)
      else siteEdit.undo(ctx)
    }

    window.addEventListener("keydown", onKeyDown)
    onCleanup(() => window.removeEventListener("keydown", onKeyDown))
  })

  return (
    <Show when={active()}>
      <div class="fixed bottom-3 left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-3xl -translate-x-1/2">
        <div class="panel-dark flex flex-wrap items-center gap-1.5 p-2 sm:gap-2">
          <span class="hidden transparent-slot px-2 py-1 text-xs text-neutral-200 sm:inline-flex">
            {translate["edit.mode"]()} · v{version()}
          </span>
          <Show when={dirty()}>
            <span class="rounded-md bg-amber-400/20 px-2 py-1 text-xs text-amber-300">
              {translate["edit.dirty"]()}
            </span>
          </Show>
          <div class="ml-auto flex flex-wrap items-center gap-1.5 sm:gap-2">
            <Button
              class="px-2 py-1 text-xs sm:py-1.5"
              disabled={!canUndo() || busy()}
              title={translate["edit.undo"]()}
              onClick={() => siteEdit.undo(ctx)}
            >
              ↶
            </Button>
            <Button
              class="px-2 py-1 text-xs sm:py-1.5"
              disabled={!canRedo() || busy()}
              title={translate["edit.redo"]()}
              onClick={() => siteEdit.redo(ctx)}
            >
              ↷
            </Button>
            <Button
              class="px-2.5 py-1 text-[11px] sm:px-3 sm:py-1.5 sm:text-xs"
              disabled={!dirty() || busy()}
              onClick={() => siteEdit.save(ctx)}
            >
              {translate["edit.save"]()}
            </Button>
            <Button
              class="px-2.5 py-1 text-[11px] sm:px-3 sm:py-1.5 sm:text-xs"
              title={dirty() ? translate["edit.save-first"]() : undefined}
              disabled={dirty() || !canPublish() || busy()}
              onClick={() => siteEdit.publish(ctx)}
            >
              {translate["edit.publish"]()}
            </Button>
            <Button
              class="px-2.5 py-1 text-[11px] sm:px-3 sm:py-1.5 sm:text-xs"
              disabled={!canPublish() || busy()}
              onClick={() => siteEdit.discard(ctx)}
            >
              {translate["edit.discard"]()}
            </Button>
            <button
              type="button"
              class="button px-2.5 py-1 text-[11px] text-neutral-50 sm:px-3 sm:py-1.5 sm:text-xs"
              onClick={() => setSiteEditMode(ctx, false)}
            >
              {translate["edit.exit"]()}
            </button>
          </div>
        </div>
      </div>
    </Show>
  )
}, "EditToolbar")
