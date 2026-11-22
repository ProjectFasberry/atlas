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

const spyglassImg = getStaticObject("minecraft", "icons/fishing_bobber.webp")

const LayoutSettingsTrigger = reatomComponent(({ ctx }) => {
  const isTriggered = useAtomAccessor(layoutSettingsState.isTriggered)
  const isOpen = useAtomAccessor(layoutSettingsState.isOpen)
  let image!: HTMLImageElement

  onMount(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (reduceMotion.matches) return

    let frame = 0
    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0
    let rect = image.getBoundingClientRect()

    const measure = () => {
      rect = image.getBoundingClientRect()
    }

    const tick = () => {
      currentX += (targetX - currentX) * 0.12
      currentY += (targetY - currentY) * 0.12

      image.style.setProperty("--rod-x", currentX.toFixed(4))
      image.style.setProperty("--rod-y", currentY.toFixed(4))

      const settled = Math.abs(targetX - currentX) < 0.001
        && Math.abs(targetY - currentY) < 0.001

      frame = settled ? 0 : requestAnimationFrame(tick)
    }

    const onPointerMove = (event: PointerEvent) => {
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      targetX = Math.max(-1, Math.min(1, (event.clientX - centerX) / 140))
      targetY = Math.max(-1, Math.min(1, (event.clientY - centerY) / 120))

      if (!frame) frame = requestAnimationFrame(tick)
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true })
    window.addEventListener("resize", measure)

    onCleanup(() => {
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("resize", measure)
      cancelAnimationFrame(frame)
    })
  })

  return (
    <button
      aria-label={translate["settings.trigger"]()}
      name="open-settings"
      onClick={() => layoutSettings.open(ctx)}
      class={`top-2/3 group -translate-y-1/4 focus:scale-[1.1]
        cursor-pointer fixed right-4 w-12 h-12 z-11 duration-500 ease-in-out
        ${isTriggered() ? "-translate-y-[9999px]" : "translate-y-0"}
        ${isOpen() ? "hidden" : "block"}
      `}
    >
      <img
        ref={image}
        src={spyglassImg}
        alt=""
        draggable={false}
        width={46}
        height={46}
        class="layout-settings-bobber"
      />
    </button>
  )
}, "LayoutSettingsTrigger")

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
