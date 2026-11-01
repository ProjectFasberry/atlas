import cn from "cnfast"

const trigger = (className?: string) => cn(
  `
    inline-flex rounded-xl items-center cursor-pointer justify-center gap-2 duration-150 border-none
    focus-visible:outline-none disabled:opacity-50
  `,
  className
)
const content = (className?: string) => cn(
  `
    flex flex-col relative bg-neutral-900 rounded-xl shadow-md shadow-black/20 outline-none z-[calc(70+var(--layer-index,0))]
    p-1 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out
  `,
  className
)
const arrow = (className?: string) => cn(
  `-z-1 [--arrow-background:bg-neutral-800]`,
  className
)
const arrowTip = (className?: string) => cn(
  `
    border-t-1 border-neutral-800 border-l-1
  `,
  className
)
const item = (className?: string) => cn(
  `
    hover:bg-neutral-800 hover:text-neutral-100 data-[variant=destructive]:text-red
    data-[variant=destructive]:hover:bg-red/10 text-sm
    data-[variant=destructive]:hover:text-red data-[variant=destructive]:*:[svg]:text-red!
    [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2
    rounded-lg px-3 py-1 duration-150 outline-hidden select-none data-[disabled]:pointer-events-none
    data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0
    [&_svg:not([class*='size-'])]:size-4
  `,
  className
)

const menuVariant = {
  content,
  trigger,
  arrow,
  arrowTip,
  item,
}

export {
  menuVariant,
}
