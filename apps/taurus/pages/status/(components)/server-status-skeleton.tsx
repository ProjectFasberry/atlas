import { Skeleton } from "@/shared/ui/skeleton"

export const ServerStatusSkeleton = () => (
  <div class="flex flex-col gap-6 w-full">
    <Skeleton class="w-full h-10" />
    <div class="flex flex-col gap-2 w-full">
      <Skeleton class="w-full h-12" />
      <Skeleton class="w-full h-12" />
      <Skeleton class="w-full h-12" />
      <Skeleton class="w-full h-12" />
      <Skeleton class="w-full h-12" />
    </div>
  </div>
)
