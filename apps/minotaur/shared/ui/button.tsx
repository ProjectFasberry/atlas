import type { ButtonHTMLAttributes } from "react"
import { tv, type VariantProps } from "tailwind-variants"
import { Icon } from "./icon"

const buttonVariants = tv({
  base: `inline-flex active:scale-[0.98] rounded-xl duration-150 ease-in cursor-pointer items-center justify-center
    disabled:select-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-70
  `,
  variants: {
    variant: {
      default: "border-none border-transparent",
      danger: "border border-red text-red",
      minecraft: "rounded-none button"
    },
    size: {
      headless: "px-0 py-0",
      default: "px-4 py-2",
      small: "px-2 py-2"
    },
    background: {
      default: "bg-neutral-800 hover:bg-neutral-700 text-neutral-50",
      compound: "bg-neutral-800 text-neutral-50",
      white: "bg-neutral-200 hover:bg-neutral-50 text-neutral-950",
      positive: "bg-gradient-to-br text-neutral-50 from-green-600/90 via-green-600/80 font-semibold to-green-600/80"
    }
  },
  defaultVariants: {
    size: "default"
  }
})

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>
  & VariantProps<typeof buttonVariants> & (
    | { withSpinner?: true, isLoading: boolean }
    | { withSpinner?: false, isLoading?: never })

export const Button = ({
  className, isLoading, withSpinner, children, ...props
}: ButtonProps) => {
  const { background, variant, size, ...rest } = props;

  return (
    <button
      className={buttonVariants({ className, background, variant, size })}
      {...rest}
    >
      {(withSpinner && isLoading) && (
        <Icon
          name="sprite:loader-2"
          className="animate-spin duration-300 mr-1 size-3"
        />
      )}
      {children}
    </button>
  )
}
