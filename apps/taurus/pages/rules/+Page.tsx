import { Link } from "@/shared/components/link";
import { getStaticObject } from "@/shared/lib/helpers";
import { Button } from "@/shared/ui/button";
import { MainWrapperPage } from "@/shared/ui/main-wrapper";
import { Overlay } from "@/shared/ui/overlay";
import { Typography } from "@/shared/ui/typography";
import { WrapperTitle } from "@/shared/ui/wrapper-title";
import { sectionVariant, sectionVariantChild } from "@/shared/styles/variants";
import { Rules } from "./(components)/rules-list";
import { RulesTags } from "./(components)/rules-tags";
import { translate } from "@/shared/locales/helpers";

const url = getStaticObject("backgrounds", "rules_background.png")

export default function Page() {
  return (
    <MainWrapperPage variant="with_section">
      <div
        class={sectionVariant({ className: "bg-bottom md:bg-center bg-cover" })}
        style={{ "background-image": `url(${url})` }}
      >
        <Overlay variant="default" />
        <WrapperTitle>
          <div class="flex flex-col gap-6 w-full lg:max-w-3xl items-start justify-start">
            <div class="flex flex-col gap-2 lg:max-w-3xl">
              <h1 class={sectionVariantChild().title({ className: "text-gold" })}>
                {translate["rules.title"]()}
              </h1>
              <Typography color="white" class={sectionVariantChild().subtitle()}>
                {translate["rules.subtitle"]()}
              </Typography>
            </div>
            <Link href="#rules-list" class={sectionVariantChild().action()}>
              <Button class="w-full px-6 py-0.5 gap-2">
                <Typography color="white" class="text-lg">
                  {translate["rules.action-text"]()}
                </Typography>
              </Button>
            </Link>
          </div>
        </WrapperTitle>
      </div>
      <div class="full-screen-section py-32">
        <div class="flex flex-col gap-10 responsive mx-auto">
          <div
            class="transparent-achievement-panel lg:gap-4 p-2 lg:p-4 flex flex-col md:flex-row w-full gap-2 justify-between"
          >
            <div class="flex flex-col lg:flex-row items-start lg:items-center gap-2">
              <Typography title="Актуальные теги" color="white" class="text-md lg:text-lg xl:text-xl">
                {translate["rules.tags.title"]()}
              </Typography>
              <div class="flex flex-wrap gap-2">
                <RulesTags />
              </div>
            </div>
          </div>
          <div id="rules-list" class="flex flex-col gap-6 w-full h-full">
            <Rules />
          </div>
        </div>
      </div>
    </MainWrapperPage>
  )
}
