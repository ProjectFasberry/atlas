import type { ComponentProps } from "react"
import { clsx } from "cnfast"

type SeparatorProps = ComponentProps<"div"> & {
  orientation?: "horizontal" | "vertical"
}

function Separator({
  className,
  orientation = "horizontal",
  ...props
}: SeparatorProps) {
  return (
    <div
      data-slot="separator"
      aria-hidden
      className={clsx(
        "bg-neutral-800 shrink-0",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
      {...props}
    />
  )
}

export { Separator }
