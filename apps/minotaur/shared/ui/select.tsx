import { SingleCheck } from "./check"
import { Select } from "@ark-ui/react/select"
import cn from "cnfast"

const control = (className?: string) => cn(
  `
     flex items-center relative w-full gap-2
  `,
  className
)
const trigger = (className?: string) => cn(
  `
    flex items-center justify-between w-full gap-2 bg-neutral-800 rounded-xl h-10
    text-sm sm:text-base px-4 py-2 text-neutral-400
    select-none border-none outline-none focus-visible:shadow-lg focus-visible:shadow-black/20
  `,
  className
)
const indicators = (className?: string) => cn(
  `
    flex pointer-events-none items-center gap-2 bg-neutral-800
    shrink-0 absolute top-1/2 right-4 -translate-y-1/2
  `,
  className
)
const clearTrigger = (className?: string) => cn(
  `
    border-none flex items-center justify-center pointer-events-auto duration-150
    ease text-neutral-400 hover:text-neutral-50
  `,
  className
)
const indicator = (className?: string) => cn(
  `
    flex items-center justify-center shrink-0 text-neutral-400
  `,
  className
)
const content = (className?: string) => cn(
  `
    flex flex-col rounded-xl bg-neutral-900 z-62 min-w-full
    data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in
    duration-300 ease-out overflow-y-auto outline-none
  `,
  className
)
const item = (className?: string) => cn(
  `
    flex hover:bg-neutral-800 gap-4 rounded-lg items-center justify-between w-full px-4 py-2 select-none
  `,
  className
)
const itemGroup = (className?: string) => cn(
  `flex flex-col w-full`,
  className
)
const itemIndicator = (className?: string) => cn(
  `flex items-center justify-center shrink-0 text-green-500`,
  className
)
const itemText = (className?: string) => cn(
  `overflow-hidden whitespace-nowrap text-ellipsis`,
  className
)
const selectContentBaseStyle = {
  minWidth: `var(--reference-width)`,
  maxHeight: `min(var(--available-height, 300px), 300px)`
}
const selectVariant = {
  control,
  itemText,
  item,
  itemGroup,
  content,
  indicator,
  clearTrigger,
  indicators,
  trigger,
  itemIndicator
}

export const SelectItemIndicator = () => {
  return (
    <Select.ItemIndicator>
      <SingleCheck />
    </Select.ItemIndicator>
  )
}

export {
  selectVariant,
  selectContentBaseStyle,
}
