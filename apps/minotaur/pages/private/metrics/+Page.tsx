import { BuildMetrics } from "@/shared/components/app/private/components/build-metrics";
import { SectionWrapper, WithHeader } from "@/shared/components/app/private/components/ui";

export default function Page() {
  return (
    <SectionWrapper className="flex flex-col gap-3 w-full h-full">
      <WithHeader title="Метрики сборок" />
      <BuildMetrics />
    </SectionWrapper>
  )
}
