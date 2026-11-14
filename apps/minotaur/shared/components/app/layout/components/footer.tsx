import { Link } from "../../../config/link/link"
import { env } from "@/shared/env"
import { Logotype } from "./logotype"
import { translate } from "@/shared/locales/helpers"
import { type AtomState } from "@reatom/framework"
import { reatomComponent } from "@reatom/npm-react"
import { socialsAtom } from "@/shared/models/shared.model"
import { SiteFooter, type SiteFooterColumn, type SiteFooterSocial } from "@repo/ui"

const getHrefs = (data: AtomState<typeof socialsAtom>) => {
  let telegramHref: string | undefined;
  let discordHref: string | undefined;

  for (let i = 0; i < data.length; i++) {
    const item = data[i];

    if (item.value === 'tg') {
      telegramHref = item.href;
    } else if (item.value === 'ds') {
      discordHref = item.href;
    }

    if (telegramHref && discordHref) break;
  }

  return { telegramHref, discordHref }
}

const createLandingUrl = (path: string) => `${env.VITE_LANDING_URL}${path}`

export const Footer = reatomComponent(({ ctx }) => {
  const data = getHrefs(ctx.spy(socialsAtom));

  const columns: SiteFooterColumn[] = [
    {
      title: translate["shared.footer.about.title"](),
      links: [
        { label: translate["shared.footer.about.news"](), href: "/news" },
        { label: translate["shared.footer.about.team"](), href: "/join" },
        { label: translate["shared.footer.about.report"](), href: "/report" },
        { label: translate["shared.footer.about.status"](), href: "https://status.fasberry.fun" },
      ],
    },
    {
      title: translate["shared.footer.info.title"](),
      links: [
        { label: translate["shared.footer.info.contacts"](), href: "/contacts" },
        { label: translate["shared.footer.info.privacy"](), href: "/privacy" },
      ],
    },
    {
      title: translate["shared.footer.resources.title"](),
      links: [
        { label: translate["shared.footer.resources.status"](), href: createLandingUrl("/status") },
        { label: translate["shared.footer.resources.faq"](), href: createLandingUrl("/wiki") },
      ],
    },
  ]

  const socials: SiteFooterSocial[] = []
  if (data.discordHref) {
    socials.push({ label: translate["support.discord"](), href: data.discordHref, icon: "discord" })
  }
  if (data.telegramHref) {
    socials.push({ label: translate["support.telegram"](), href: data.telegramHref, icon: "telegram" })
  }

  return (
    <SiteFooter
      className="pb-[calc(6rem+env(safe-area-inset-bottom))]"
      linkComponent={Link}
      logo={
        <div className="h-14 w-full">
          <Logotype />
        </div>
      }
      columns={columns}
      socials={socials}
      warning={translate["shared.footer.warning"]()}
    />
  )
}, "Footer")
