import { useData } from "vike-solid/useData";
import { MainWrapperPage } from "@/shared/ui/main-wrapper";
import { JoinSection } from "./(components)/join";
import { NewsSection } from "./(components)/news";
import { CommunitySection } from "./(components)/community";
import { FaqSection } from "./(components)/faq";
import { HeroSection } from "./(components)/hero";
import { FeaturesSection } from "./(components)/features";
import { SpawnSection } from "./(components)/spawn";
import { SocialsSection } from "./(components)/socials";
import { useAtomAccessor } from "@/shared/lib/utils";
import { siteEdit } from "@/shared/models/site-edit.model";
import { resolveSpawnSlides } from "./(models)/spawn-carousel.model";
import { asBlocks, asSectionsContent, type HomeContent } from "@/shared/api/site";
import { EditProvider } from "@/shared/components/edit/edit-provider";
import { PageEdit } from "@/shared/components/edit/page-edit";
import type { Data } from "./+data";

export default function Page() {
  const pageData = useData<Data>()
  const editing = useAtomAccessor(siteEdit.active)

  return (
    <MainWrapperPage
      variant="with_section"
      class={editing() ? "landing-page pb-24" : "landing-page"}
    >
      <EditProvider
        page="home"
        locale={pageData.locale}
        canEdit={Boolean(pageData.canEdit)}
        canPublish={Boolean(pageData.canPublish)}
        build={(content) => ({
          kind: "home",
          slides: resolveSpawnSlides(content as HomeContent | null).map(({ imageKey, alt }) => ({ imageKey, alt })),
          sections: asSectionsContent(content),
          blocks: asBlocks(content),
        })}
      />
      <HeroSection />
      <JoinSection />
      <FeaturesSection />
      <NewsSection />
      <SpawnSection />
      <CommunitySection />
      <FaqSection />
      <SocialsSection />
      <PageEdit page="home" kind="home" content={pageData.content} canEdit={pageData.canEdit} editing={editing} />
    </MainWrapperPage>
  )
}
