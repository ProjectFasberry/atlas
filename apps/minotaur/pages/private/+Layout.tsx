import { type PropsWithChildren } from "react"
import { Sidebar } from "@/shared/components/app/private/components/sidebar";

export default function Layout({ children }: PropsWithChildren) {
  return (
    <div className="flex flex-col lg:flex-row w-full min-w-0 relative h-full gap-4">
      <Sidebar />
      <div className="flex min-w-0 flex-col gap-2 min-h-dvh w-full lg:flex-1">
        {children}
      </div>
    </div>
  )
}
