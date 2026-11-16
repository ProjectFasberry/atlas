import { SocialsPanel } from "@/shared/components/app/private/components/socials";
import { SectionWrapper, WithHeader } from "@/shared/components/app/private/components/ui";
import { translate } from "@/shared/locales/helpers"

export default function Page() {
  return (
    <SectionWrapper className="flex flex-col gap-3 w-full h-full">
      <WithHeader title={translate["panel.socials"]()} />
      <SocialsPanel />
    </SectionWrapper>
  )
}
