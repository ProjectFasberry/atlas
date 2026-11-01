import cn from "cnfast";

const root = (className?: string) => cn(
  `
  flex w-full relative items-center rounded-xl sm:overflow-hidden mb-6
  [--slide-spacing:8px]! sm:[--slide-spacing:16px]! h-[160px] sm:h-[350px]
  `,
  className,
)
const indicator = (className?: string) => cn(
  `
    h-4 sm:h-3 data-current:bg-neutral-50 bg-neutral-500 rounded-full aspect-square
  `,
  className,
)
const indicators = (className?: string) => cn(
  `
    absolute -bottom-8 sm:bottom-2 left-0 w-full right-0 z-1 flex items-center justify-center
  `,
  className,
)
const item = (className?: string) => cn(
  `
    flex-[0_0_70%] sm:flex-[0_0_60%] h-[160px] sm:h-[350px] rounded-xl overflow-hidden min-w-0 w-full
  `,
  className,
)
const image = (className?: string) => cn(
  `w-full h-full select-none object-cover`,
  className,
)
const carouselVariant = {
  root,
  indicator,
  indicators,
  item,
  image
}

export { carouselVariant }
