import { Tooltip as ArkTooltip } from "@ark-ui/react/tooltip"
import { Portal } from "@ark-ui/react/portal"
import { tv, type VariantProps } from "tailwind-variants"
import type { ReactNode } from "react"

export const tooltipVariant = tv({
  base: `
    z-[calc(60+var(--layer-index,0))] max-w-72 rounded-xl border bg-neutral-900 px-3 py-2
    text-sm leading-5 shadow-md shadow-black/20 outline-none
    data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95
    data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95
  `,
  variants: {
    variant: {
      default: "border-neutral-700 text-neutral-100",
      success: "border-green-700/70 text-green-300",
      error: "border-red/60 text-red",
      warning: "border-yellow-700/70 text-yellow-300",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

type TooltipProps = {
  /** The element the tooltip is anchored to. */
  children: ReactNode
  content: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  variant?: VariantProps<typeof tooltipVariant>["variant"]
  placement?: "top" | "bottom" | "left" | "right"
  contentClassName?: string
}

export const Tooltip = ({
  children,
  content,
  open,
  onOpenChange,
  variant,
  placement = "top",
  contentClassName,
}: TooltipProps) => (
  <ArkTooltip.Root
    open={open}
    onOpenChange={({ open }) => onOpenChange?.(open)}
    positioning={{ placement }}
  >
    <ArkTooltip.Trigger asChild>{children}</ArkTooltip.Trigger>
    <Portal>
      <ArkTooltip.Positioner>
        <ArkTooltip.Content className={tooltipVariant({ variant, className: contentClassName })}>
          {content}
        </ArkTooltip.Content>
      </ArkTooltip.Positioner>
    </Portal>
  </ArkTooltip.Root>
)
