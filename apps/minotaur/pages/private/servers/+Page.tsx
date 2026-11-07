import { Servers } from "@/shared/components/app/private/components/servers";
import { SectionWrapper, WithHeader } from "@/shared/components/app/private/components/ui";

export default function Page() {
  return (
    <SectionWrapper className="flex flex-col gap-3 w-full h-full">
      <WithHeader title="Серверы" />
      <Servers />
    </SectionWrapper>
  )
}
