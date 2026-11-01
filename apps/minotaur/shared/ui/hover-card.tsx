import cn from "cnfast"

const trigger = (className?: string) => cn(
  `inline-flex items-center cursor-pointer transition-colors focus-visible:outline-none`,
  className,
)
const content = (className?: string) => cn(
  `
    relative flex flex-col p-2 shadow-md [--arrow-size:10px] [--arrow-background]:bg-neutral-900 shadow-black/20 outline-none
    bg-neutral-900 rounded-xl z-[calc(50+var(--layer-index,0))] origin-(--transform-origin) border-none duration-300
    data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:ease-out
    data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:ease-in
  `,
  className
)
const arrow = (className?: string) => cn(
  `[--arrow-background:bg-neutral-900]`,
  className,
)
const arrowTip = (className?: string) => cn(
  `border-t-1 border-neutral-800 border-l-1`,
  className,
)
const hoverCardVariant = {
  trigger,
  content,
  arrow,
  arrowTip,
}
export {
  hoverCardVariant,
}
