import { type ReactNode } from "react"
import { SectionWrapper } from "./ui"
import { Typography } from "@/shared/ui/typography"

type PanelSectionProps = {
  id?: string
  title: string
  /** Section key of the actions model, so a mode switch can scroll back here. */
  parent?: string
  action?: ReactNode
  children: ReactNode
}

export const PanelSection = ({ id, title, parent, action, children }: PanelSectionProps) => (
  <SectionWrapper
    id={id}
    data-config-section={parent}
    className="flex flex-col gap-2 w-full scroll-mt-24"
  >
    <div className="flex items-center justify-between gap-2 w-full">
      <Typography className="text-base font-semibold">{title}</Typography>
      {action}
    </div>
    <div className="flex flex-col gap-2 w-full">
      {children}
    </div>
  </SectionWrapper>
)
