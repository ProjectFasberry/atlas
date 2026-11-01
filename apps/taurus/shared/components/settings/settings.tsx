import { Dialog } from "@ark-ui/solid/dialog";
import { useAtom, useCtx } from "@reatom/npm-solid-js";
import { Portal } from 'solid-js/web'
import { DialogClose, dialogVariant } from "@/shared/ui/dialog";
import { getStaticObject } from "@/shared/lib/helpers";
import { layoutSettingsState, layoutSettings } from "./settings.model";
import { translate } from "../../locales/helpers";
import { lazy, Suspense } from "solid-js";

const SettingsList = lazy(() => import("./list").then(m => ({ default: m.SettingsList })))

const spyglassImg = getStaticObject("minecraft", "icons/fishing_bobber.webp")

const LayoutSettingsTrigger = () => {
  const ctx = useCtx();

  const [isTriggeredAtom] = useAtom(layoutSettingsState.isTriggered)
  const [isOpenAtom] = useAtom(layoutSettingsState.isOpen)

  return (
    <button
      aria-label="Открыть настройки сайта"
      name="open-settings"
      onClick={() => layoutSettings.open(ctx)}
      class={`top-2/3 group -translate-y-1/4 focus:scale-[1.1] cursor-pointer absolute right-4 w-12 h-12 z-11 duration-500 ease-in-out
        ${isTriggeredAtom() ? "-translate-y-[9999px]" : "translate-y-0"}
        ${isOpenAtom() ? "hidden" : "block"}
      `}
    >
      <img src={spyglassImg} alt="" draggable={false} width={46} height={46} />
    </button>
  )
}

const LayoutSettingsDialog = () => {
  const [isOpenAtom, setIsOpenAtom] = useAtom(layoutSettingsState.isOpen);

  return (
    <Dialog.Root open={isOpenAtom()} onOpenChange={(details) => setIsOpenAtom(details.open)}>
      <Portal>
        <Dialog.Backdrop class={dialogVariant.backdrop()} />
        <Dialog.Positioner class={dialogVariant.positioner()}>
          <Dialog.Content class={dialogVariant.content({ class: "sm:w-1/3" })}>
            <Dialog.Title class={dialogVariant.title()}>
              {translate["settings.title"]()}
            </Dialog.Title>
            <div class="flex flex-col gap-2 w-full">
              <Suspense>
                <SettingsList />
              </Suspense>
            </div>
            <DialogClose />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}

export const LayoutSettings = () => {
  return (
    <>
      <LayoutSettingsTrigger />
      <LayoutSettingsDialog />
    </>
  )
}
