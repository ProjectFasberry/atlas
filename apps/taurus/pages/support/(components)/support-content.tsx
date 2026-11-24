import { SupportCards } from "./support-cards"
import { SupportDetails } from "./support-details"
import { SupportFaq } from "./support-faq"
import { SupportCta } from "./support-cta"

export const SupportContent = () => (
  <div class="responsive mx-auto flex flex-col gap-10 sm:gap-12">
    <SupportCards />
    <SupportDetails />
    <SupportFaq />
    <SupportCta />
  </div>
)
