import { Typography } from "@/shared/ui/typography"
import { Icon } from "@/shared/ui/icon"

export type LoaderProps = { title: string, subtitle?: string }

export const LoaderNode = ({ title, subtitle }: LoaderProps) => {
  return (
    <div
      className="
        flex flex-col gap-4 fixed inset-0 supports-backdrop-filter:backdrop-blur-xs bg-black/60
        pointer-events-auto overflow-hidden duration-300 z-100 items-center justify-center h-full w-full
      "
    >
      <Icon name="sprite:loader-2" className="animate-spin size-10" />
      <Typography className="font-semibold text-xl">
        {title}
      </Typography>
      {subtitle && (
        <Typography color="gray" className="text-sm">
          {subtitle}
        </Typography>
      )}
    </div>
  )
}
