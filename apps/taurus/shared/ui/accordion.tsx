import { tv } from "tailwind-variants";

const root = tv({
  base: `
    flex [--px:4px] [--py:4px] w-full
    data-[orientation=vertical]:flex-col data-[orientation=vertical]:max-h-[calc(100vh-16px)]
  `
})
const item = tv({
  base: `data-[orientation=vertical]:block data-[orientation=horizontal]:flex`
})
const itemTrigger = tv({
  base: `
    flex items-center justify-between gap-2 m-0 text-start leading-[1.5] outline-none
    focus-visible:outline focus-visible:outline-neutral-50
  `
})
const itemIndicator = tv({
  base: ``
})
const itemContent = tv({
  base: `accordion-item-content`
})
const accordionVariant = {
  itemContent,
  itemIndicator,
  item,
  itemTrigger,
  root,
}
export {
  accordionVariant
}
