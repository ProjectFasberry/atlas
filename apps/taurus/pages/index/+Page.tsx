import { Show, type Accessor } from "solid-js";
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
import { asBlocks, asSectionsContent, type HomeContent } from "@/shared/api/site";
import { EditableSections } from "@/shared/components/edit/editable-sections";
import { EditProvider } from "@/shared/components/edit/edit-provider";
import type { Data } from "./+data";

const Edit = reatomComponent<{ pageData: Data, editing: Accessor<boolean> }>(({ ctx, ...props }) => {
  const editContent = useAtomAccessor(siteEdit.content)

  siteEdit.setPublishedBlocks(ctx, asBlocks(props.pageData?.content))

  return (
    <>
      <EditableSections
        sections={props.editing() && editContent()
          ? editContent()!.sections
          : asSectionsContent(props.pageData.content)}
        editing={props.editing()}
      />
      <EditEntry canEdit={Boolean(props.pageData?.canEdit)} />
      <Show when={props.editing()}>
        <EditToolbar />
      </Show>
    </>
  )
})

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
          slides: createSpawnEditSlides(content as HomeContent | null),
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
      <Edit editing={editing} pageData={pageData} />
    </MainWrapperPage>
  )
}
