import { Show } from "solid-js";
import { useData } from "vike-solid/useData";
import { Link } from "@/shared/components/link";
import { Button } from "@/shared/ui/button";
import { MainWrapperPage } from "@/shared/ui/main-wrapper";
import { Overlay } from "@/shared/ui/overlay";
import { Typography } from "@/shared/ui/typography";
import { WrapperTitle } from "@/shared/ui/wrapper-title";
import { sectionVariant, sectionVariantChild } from "@/shared/styles/variants";
import { getStaticObject } from "@/shared/lib/helpers";
import { translate } from "@/shared/locales/helpers";
import { SupportContent } from "./(components)/support-content";
import { reatomComponent } from "@/shared/lib/reatom";
import { siteEdit } from "@/shared/models/site-edit.model";
import { asBlocks, asSectionsContent } from "@/shared/api/site";
import { EditableSections } from "@/shared/components/edit/editable-sections";
import { EditToolbar } from "@/shared/components/edit/edit-toolbar";
import { EditEntry } from "@/shared/components/edit/edit-entry";
import { BlockControls, BlockSubtitle, BlockTitle, useBlockHidden } from "@/shared/components/edit/section-block";
import type { Data } from "./+data";

const bgImage = getStaticObject("backgrounds", "support_background.png");

export default reatomComponent(({ ctx }) => {
  const pageData = useData<Data>()
  const edit = pageData?.edit

  siteEdit.setPublishedBlocks(ctx, asBlocks(pageData.content))

  const heroHidden = useBlockHidden("support-hero")

  if (edit?.active) {
    siteEdit.init(ctx, {
      page: "support",
      locale: edit.locale,
      version: edit.version,
      canPublish: edit.canPublish,
      content: {
        kind: "sections",
        sections: asSectionsContent(pageData.content),
        blocks: asBlocks(pageData.content),
      },
    })
  }

  return (
    <MainWrapperPage variant="with_section" class={edit?.active ? "pb-24" : undefined}>
      <Show when={!heroHidden()}>
      <div
        class={sectionVariant()}
        style={{ "background-image": `url(${bgImage})` }}
      >
        <Overlay variant="default" />
        <WrapperTitle>
          <div class="flex flex-col gap-6 w-full lg:max-w-3xl items-start justify-start">
            <div class="flex flex-col gap-2 w-full lg:max-w-3xl">
              <BlockTitle
                id="support-hero"
                fallback={translate["support.title"]()}
                as="h1"
                class={sectionVariantChild().title({ className: "text-gold" })}
              />
              <BlockSubtitle
                id="support-hero"
                fallback={translate["support.subtitle"]()}
                class={sectionVariantChild().subtitle()}
              />
              <BlockControls id="support-hero" />
            </div>
            <Link href="#support-list" class={sectionVariantChild().action()}>
              <Button class="w-full px-6 py-0.5 gap-2">
                <Typography class="text-lg">
                  {translate["support.action-text"]()}
                </Typography>
              </Button>
            </Link>
          </div>
        </WrapperTitle>
      </div>
      </Show>
      <div id="support-list" class="full-screen-section py-16 lg:py-24">
        <SupportContent />
      </div>
      <EditableSections
        sections={edit?.active && ctx.get(siteEdit.content)?.kind === "sections"
          ? ctx.get(siteEdit.content)!.sections
          : asSectionsContent(pageData.content)}
        editing={Boolean(edit?.active)}
      />
      <EditEntry active={Boolean(edit?.active)} canEdit={Boolean(pageData?.canEdit)} />
      <Show when={edit?.active}>
        <EditToolbar />
      </Show>
    </MainWrapperPage>
  )
}, "SupportPage")
