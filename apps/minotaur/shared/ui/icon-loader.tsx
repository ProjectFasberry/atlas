import { Icon, type IconProps } from "@/shared/ui/icon"
import cn from "cnfast"

export const IconLoader = ({ className, ...props }: Partial<IconProps>) => {
  return (
    <Icon
      {...props}
      name="sprite:loader-2"
      className={cn("animate-spin text-neutral-500 duration-200", className)}
    />
  )
}
