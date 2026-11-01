import { tv } from "tailwind-variants"

const trigger = tv({
  base: `
    inline-flex items-center cursor-pointer justify-center gap-2 duration-150 border-none
    focus-visible:outline-none disabled:opacity-50
  `
})
const content = tv({
  base: `
    flex flex-col relative bg-neutral-900 shadow-md shadow-black/20 outline-none z-[calc(70+var(--layer-index,0))]
    p-2 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out
  `
})
const item = tv({
  base: `
    hover:bg-neutral-800 hover:text-neutral-100 data-[variant=destructive]:text-red
    data-[variant=destructive]:hover:bg-red/10
    data-[variant=destructive]:hover:text-red data-[variant=destructive]:*:[svg]:text-red!
    [&_svg:not([class*='text-'])]:text-neutral-400 relative flex cursor-default items-center gap-2
    rounded-lg px-2 py-1.5 duration-300 outline-hidden select-none data-[disabled]:pointer-events-none
    data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0
    [&_svg:not([class*='size-'])]:size-4
  `
})
const menuVariant = {
  item,
  content,
  trigger
}
export {
  menuVariant
}
