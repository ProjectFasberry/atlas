import { Dialog } from "@ark-ui/solid/dialog";
import { useAtom } from "@reatom/npm-solid-js";
import { Portal } from 'solid-js/web'
import { DialogClose, dialogVariant } from "@/shared/ui/dialog";
import { getStaticObject } from "@/shared/lib/helpers";
import { layoutSettingsState, layoutSettings } from "./settings.model";
import { translate } from "../../locales/helpers";
import { lazy, onCleanup, onMount, Suspense } from "solid-js";
import { useAtomAccessor } from "@/shared/lib/utils";
import { reatomComponent } from "@/shared/lib/reatom";

const SettingsList = lazy(() => import("./list")
  .then(m => ({ default: m.SettingsList })))

const settingsItemImg = getStaticObject("minecraft", "items/compass.webp")

/**
 * Settings live in the header like a Minecraft menu item: a slot-sized button
 * with the usual tooltip, never floating over the page content.
 */
export const SettingsTrigger = reatomComponent(({ ctx }) => {
  const isOpen = useAtomAccessor(layoutSettingsState.isOpen)

  return (
    <button
      type="button"
      name="open-settings"
      aria-label={translate["settings.trigger"]()}
      onClick={() => layoutSettings.open(ctx)}
      class={`group relative block size-11 shrink-0 cursor-pointer p-1 opacity-90
        outline-none hover:opacity-100
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white
        ${isOpen() ? "pointer-events-none opacity-0" : ""}
      `}
    >
      <img
        src={settingsItemImg}
        alt=""
        draggable={false}
        width={36}
        height={36}
        class="size-full object-contain drop-shadow-[0_2px_2px_rgb(0_0_0/0.55)]"
        style={{ "image-rendering": "pixelated" }}
      />
      <span aria-hidden="true" class="layout-settings-tip">
        {translate["settings.trigger"]()}
      </span>
    </button>
  )
}, "SettingsTrigger")

const LayoutSettingsDialog = () => {
  const [isOpenAtom, setIsOpenAtom] = useAtom(layoutSettingsState.isOpen);

  return (
    <Dialog.Root open={isOpenAtom()} onOpenChange={(details) => setIsOpenAtom(details.open)}>
      <Portal>
        <Dialog.Backdrop class={dialogVariant.backdrop()} />
        <Dialog.Positioner class={dialogVariant.positioner()}>
          <Dialog.Content class={dialogVariant.content({ class: "w-full max-w-[440px]!" })}>
            <Dialog.Title class={`${dialogVariant.title()} text-shadow-lg text-xl sm:text-2xl`}>
              {translate["settings.title"]()}
            </Dialog.Title>
            <div class="flex w-full flex-col px-1">
              <Suspense>
                <SettingsList />
              </Suspense>
            </div>
            <div class="flex w-full justify-end pt-1">
              <Dialog.CloseTrigger class="button px-6 py-1 text-sm text-white">
                {translate["settings.done"]()}
              </Dialog.CloseTrigger>
            </div>
            <DialogClose />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}

export const LayoutSettings = reatomComponent(({ ctx }) => {
  const isOpen = useAtomAccessor(layoutSettingsState.isOpen)

  onMount(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.metaKey || event.ctrlKey || event.altKey) return
      // The dialog closes itself on Escape; only open it when it is closed.
      if (event.defaultPrevented || isOpen()) return

      event.preventDefault()
      layoutSettings.open(ctx)
    }

    window.addEventListener("keydown", onKeyDown)
    onCleanup(() => window.removeEventListener("keydown", onKeyDown))
  })

  return <LayoutSettingsDialog />
}, "LayoutSettings")
