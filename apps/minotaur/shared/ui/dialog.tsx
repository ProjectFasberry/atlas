import type { CSSProperties } from "react"
import { DIALOG_DELAY } from "../consts"
import { Dialog } from "@ark-ui/react/dialog"
import { Icon } from "@/shared/ui/icon"
import cn from "cnfast"

const backdrop = (className?: string) => cn(
  `
    fixed inset-0 bg-black/60 backdrop-blur-lg z-[calc(60+var(--layer-index,0))]
    data-[state=open]:animate-in data-[state=open]:fade-in
    data-[state=closed]:animate-out data-[state=closed]:fade-out
  `,
  className
)

const positioner = (className?: string) => cn(`
  fixed inset-0 flex items-center justify-center
  z-[calc(60+var(--layer-index,0))] overscroll-y-none scrollbar-gutter-stable
  ${className}
`)

const content = (className?: string) => cn(`
    relative flex flex-col items-center justify-center overflow-hidden gap-4
    w-full max-w-[min(var(--spacing-container-lg),calc(100vw-16px))] p-2 sm:p-4
    bg-neutral-900 border-none rounded-xl outline-none
    shadow-md transition-transform z-[60+var(--layer-index,0))]
    translate-x-[calc(var(--scrollbar-width,0px)/2)]
    data-[has-nested]:scale-[calc(1-var(--nested-layer-count)*0.05)]
    data-[state=open]:animate-in data-[state=open]:zoom-in-95 data-[state=open]:fade-in
    data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=closed]:fade-out
    ${className}
  `
)
const title = (className?: string) => cn(
  "text-base sm:text-lg font-semibold leading-6 text-center tracking-tight",
  className
)
const close = (className?: string) => cn(
  `
    inline-flex items-center cursor-pointer *:w-5 *:h-5 justify-center absolute right-2 top-2 w-8 h-8 p-0 border-none rounded-lg
    hover:bg-neutral-800 text-neutral-400
    ${className}
  `
)

const DialogClose = () => {
  return (
    <Dialog.CloseTrigger className={close()}>
      <Icon name="sprite:x" className="size-4" />
    </Dialog.CloseTrigger>
  )
}

const dialogBaseStyle: CSSProperties = {
  transitionDuration: `${DIALOG_DELAY}ms`
}

const dialogVariant = {
  content,
  title,
  close,
  positioner,
  backdrop,
}

export {
  dialogVariant,
  dialogBaseStyle,
  DialogClose
}
