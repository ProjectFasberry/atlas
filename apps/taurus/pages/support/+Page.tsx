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

const bgImage = getStaticObject("backgrounds", "support_background.png");

export default function Page() {
  return (
    <MainWrapperPage variant="with_section">
      <div
        class={sectionVariant()}
        style={{ "background-image": `url(${bgImage})` }}
      >
        <Overlay variant="default" />
        <WrapperTitle>
          <div class="flex flex-col gap-6 w-full lg:max-w-3xl items-start justify-start">
            <div class="flex flex-col gap-2 w-full lg:max-w-3xl">
              <h1 class={sectionVariantChild().title({ className: "text-gold" })}>
                {translate["support.title"]()}
              </h1>
              <Typography class={sectionVariantChild().subtitle()}>
                {translate["support.subtitle"]()}
              </Typography>
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

      <div id="support-list" class="full-screen-section py-16 lg:py-24">
        <SupportContent />
      </div>
    </MainWrapperPage>
  )
}
