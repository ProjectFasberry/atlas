import { tv } from "tailwind-variants"
import { Dialog } from "@ark-ui/solid/dialog"
import { Icon } from "./icon"

const backdrop = tv({
  base: `
    fixed inset-0 bg-black/60 backdrop-blur-lg z-[calc(60+var(--layer-index,0))]
    data-[state=open]:animate-in data-[state=open]:fade-in
    data-[state=closed]:animate-out data-[state=closed]:fade-out
  `
})
const positioner = tv({
  base: `
    fixed inset-0 flex items-center justify-center
    z-[calc(60+var(--layer-index,0))] overscroll-y-none scrollbar-gutter-stable
  `
})
const content = tv({
  base: `
    relative flex flex-col panel-dark items-center justify-center overflow-hidden gap-4
    w-full max-w-[min(var(--spacing-container-lg),calc(100vw-16px))] p-2 sm:p-4 outline-none
    shadow-md transition-transform z-[60+var(--layer-index,0))]
    translate-x-[calc(var(--scrollbar-width,0px)/2)]
    data-[has-nested]:scale-[calc(1-var(--nested-layer-count)*0.05)]
    data-[state=open]:animate-in data-[state=open]:zoom-in-95 data-[state=open]:fade-in
    data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=closed]:fade-out
  `
})
const title = tv({
  base: "text-base sm:text-lg font-semibold leading-6 text-center tracking-tight"
})
const close = tv({
  base: `
    inline-flex items-center cursor-pointer *:w-5 *:h-5 justify-center absolute right-2 top-2 w-8 h-8 p-0
    hover:bg-neutral-50 hover:text-neutral-950 text-neutral-50
  `
})

const dialogVariant = {
  close,
  title,
  positioner,
  content,
  backdrop
}

const DialogClose = () => {
  return (
    <Dialog.CloseTrigger class={dialogVariant.close()}>
      <Icon name="sprite:x" />
    </Dialog.CloseTrigger>
  )
}

export {
  dialogVariant,
  DialogClose
}
