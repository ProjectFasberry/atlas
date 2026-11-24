import { Show } from "solid-js";
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
import { reatomComponent } from "@/shared/lib/reatom";
import { siteEdit } from "@/shared/models/site-edit.model";
import { EditToolbar } from "@/shared/components/edit/edit-toolbar";
import { EditEntry } from "@/shared/components/edit/edit-entry";
import { createSpawnEditSlides } from "./(models)/spawn-carousel.model";
import { asBlocks, asSectionsContent } from "@/shared/api/site";
import { EditableSections } from "@/shared/components/edit/editable-sections";
import type { Data } from "./+data";

export default reatomComponent(({ ctx }) => {
  const pageData = useData<Data>()
  const edit = pageData?.edit
  const editContent = useAtomAccessor(siteEdit.content)

  siteEdit.setPublishedBlocks(ctx, asBlocks(pageData?.content))

  if (edit?.active) {
    siteEdit.init(ctx, {
      page: "home",
      locale: edit.locale,
      version: edit.version,
      canPublish: edit.canPublish,
      content: {
        kind: "home",
        slides: createSpawnEditSlides(pageData.content),
        sections: asSectionsContent(pageData.content),
        blocks: asBlocks(pageData.content),
      },
    })
  }

  return (
    <MainWrapperPage
      variant="with_section"
      class={edit?.active ? "landing-page pb-24" : "landing-page"}
    >
      <HeroSection />
      <JoinSection />
      <FeaturesSection />
      <NewsSection />
      <SpawnSection />
      <CommunitySection />
      <FaqSection />
      <SocialsSection />
      <EditableSections
        sections={edit?.active && editContent()
          ? editContent()!.sections
          : asSectionsContent(pageData.content)}
        editing={Boolean(edit?.active)}
      />
      <EditEntry active={Boolean(edit?.active)} canEdit={Boolean(pageData?.canEdit)} />
      <Show when={edit?.active}>
        <EditToolbar />
      </Show>
    </MainWrapperPage>
  )
}, "LandingPage")
