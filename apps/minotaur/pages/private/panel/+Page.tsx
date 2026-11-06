import { ConfigEditor } from "@/shared/components/app/private/components/traefik";
import { SectionWrapper, WithHeader } from "@/shared/components/app/private/components/ui";

export default function Page() {
  return (
    <SectionWrapper className="flex flex-col gap-4 w-full h-full">
      <WithHeader title="Динамическая конфигурация Traefik" />
      <ConfigEditor />
    </SectionWrapper>
  )
}
