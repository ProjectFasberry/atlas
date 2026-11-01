import { Icon } from "@/shared/ui/icon"
import { tv, type VariantProps } from "tailwind-variants"
import cn from "cnfast"
import type { ComponentPropsWithoutRef } from "react"

const controlVariant = tv({
  base: `
    inline-flex items-center justify-center gap-1 cursor-pointer peer relative border-2 group border-neutral-200
    data-[state=checked]:text-neutral-50 data-[state=checked]:border-green-600
    focus-visible:border-neutral-600 focus-visible:ring-neutral-700/50 aria-invalid:ring-red-600/20
    aria-invalid:border-red-600 size-4 shrink-0
    rounded-md transition-shadow outline-none focus-visible:ring-[3px]
    disabled:cursor-not-allowed disabled:opacity-50
  `,
  variants: {
    size: {
      small: "h-3 w-3",
      medium: "h-5 w-5",
    },
    variant: {
      default: " ",
      filled: "data-[state=checked]:bg-green-600"
    },
  },
  defaultVariants: {
    size: "medium",
    variant: "default"
  }
})
const control = (props?: VariantProps<typeof controlVariant>) => cn(controlVariant(props));

const indicator = (className?: string) => cn(
  `size-4 shrink-0 rounded-inherit transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50`,
  className
)

const root = (className?: string) => cn(
  `inline-flex items-center gap-2 relative disabled:opacity-50 disabled:grayscale-[100%]`,
  className
)

const label = (className?: string) => cn(
  `select-none text-neutral-50 text-base`,
  className
)

export const checkboxVariant = {
  control,
  root,
  indicator,
  label
}

export const CheckboxIndicatorIcon = ({ name: _, className, ...props }: ComponentPropsWithoutRef<"svg">) => {
  return (
    <Icon
      name="sprite:check"
      className={cn("size-3.5 group-data-[state=checked]:block group-data-[state=unchecked]:hidden m-auto -z-1", className)}
      {...props}
    />
  )
}
