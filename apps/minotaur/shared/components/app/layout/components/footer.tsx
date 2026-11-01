import { Icon } from "@/shared/ui/icon"
import { Link } from "../../../config/link/link"
import { Typography } from "@/shared/ui/typography"
import { env } from "@/shared/env"
import { Logotype } from "./logotype"
import { translate } from "@/shared/locales/helpers"
import { action } from "@reatom/framework"
import { reatomComponent } from "@reatom/npm-react"
import { socialsAtom } from "@/shared/models/shared.model"

const getHrefs = action((ctx) => {
  const data = ctx.get(socialsAtom);
  if (!data) return null;

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
})

const createLandingUrl = (path: string) => `${env.VITE_LANDING_URL}${path}`

export const Footer = reatomComponent(({ ctx }) => {
  const data = getHrefs(ctx);

  return (
    <div
      className="
        flex items-center justify-center w-full pb-24 h-full lg:min-h-40 p-3 lg:p-4
        bg-gradient-to-br from-green-800/40 via-green-800/50 to-green-800/40 border-t border-green-700/20
        lg:backdrop-blur-md
      "
    >
      <div className="flex flex-col items-center justify-center responsive h-full gap-4">
        <div className="flex flex-col lg:flex-row justify-between gap-4 lg:items-start w-full h-full">
          <div className="flex flex-col gap-4 items-start h-full w-full lg:w-1/3">
            <div className="h-14 w-full">
              <Logotype />
            </div>
            {data && (
              <div
                className="
                flex items-center gap-2
                *:bg-neutral-600/40 *:hover:bg-neutral-600/60 *:duration-150
                *:flex *:items-center *:justify-center *:p-2 *:rounded-full
              "
              >
                <a href={data.discordHref} aria-label="Дискорд">
                  <Icon name="sprite:brand-discord" className="size-[18px]" />
                </a>
                <a href={data.telegramHref} aria-label="Телеграм">
                  <Icon name="sprite:brand-telegram" className="size-[18px]" />
                </a>
              </div>
            )}
          </div>
          <div className="grid auto-rows-auto grid-cols-1 lg:grid-rows-none lg:grid-cols-3 gap-4 w-full lg:w-2/3">
            <div className="flex flex-col min-w-0 gap-1 *:w-fit">
              <Typography className="font-semibold truncate">
                {translate["shared.footer.about.title"]()}
              </Typography>
              <div className="flex flex-col gap-1 min-w-0 *:truncate">
                <Link href="/news">
                  {translate["shared.footer.about.news"]()}
                </Link>
                <a href="https://status.fasberry.fun">
                  {translate["shared.footer.about.status"]()}
                </a>
              </div>
            </div>
            <div className="flex flex-col min-w-0 gap-1 *:w-fit">
              <Typography className="font-semibold truncate">
                {translate["shared.footer.info.title"]()}
              </Typography>
              <div className="flex flex-col gap-1 min-w-0 *:truncate">
                <a href="/contacts" target="_blank">
                  {translate["shared.footer.info.contacts"]()}
                </a>
                <a href="/privacy" target="_blank">
                  {translate["shared.footer.info.privacy"]()}
                </a>
              </div>
            </div>
            <div className="flex flex-col min-w-0 gap-1 *:w-fit">
              <Typography className="font-semibold truncate">
                {translate["shared.footer.resources.title"]()}
              </Typography>
              <div className="flex flex-col gap-1 min-w-0 *:truncate">
                <a href={createLandingUrl("/status")}>
                  {translate["shared.footer.resources.status"]()}
                </a>
                <a href={createLandingUrl("/wiki")}>
                  {translate["shared.footer.resources.faq"]()}
                </a>
              </div>
            </div>
          </div>
        </div>
        <Typography className="text-neutral-400 text-sm truncate text-wrap">
          {translate["shared.footer.warning"]()}
        </Typography>
      </div>
    </div>
  )
}, "Footer")
