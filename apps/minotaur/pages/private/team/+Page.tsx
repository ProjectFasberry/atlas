import { SectionWrapper, WithHeader } from "@/shared/components/app/private/components/ui"
import { TeamApplications } from "@/shared/components/app/private/components/team"

export default function Page() {
  return (
    <SectionWrapper className="flex flex-col gap-3 w-full h-full">
      <WithHeader title="Заявки в команду" />
      <TeamApplications />
    </SectionWrapper>
  )
}
