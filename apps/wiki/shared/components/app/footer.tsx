import { SiteFooter, type SiteFooterColumn, type SiteFooterSocial } from '@repo/ui';
import { publicEnv } from '@/lib/env/public';
import { getLocale } from '@/lib/i18n/locale';
import { m } from '@/paraglide/messages';

const LANDING = 'https://fasberry.fun';

/**
 * Site footer shared with minotaur: the same component and columns, the logo
 * carries the `wiki` suffix. Server-rendered, so it follows the reading locale.
 */
export async function Footer() {
  const locale = await getLocale();

  const columns: SiteFooterColumn[] = [
    {
      title: m['footer.about.title']({}, { locale }),
      links: [
        { label: m['footer.about.news']({}, { locale }), href: `${LANDING}/news` },
        { label: m['footer.about.team']({}, { locale }), href: `${LANDING}/join` },
        { label: m['footer.about.report']({}, { locale }), href: `${LANDING}/report` },
        {
          label: m['footer.about.status']({}, { locale }),
          href: 'https://status.fasberry.fun',
        },
      ],
    },
    {
      title: m['footer.info.title']({}, { locale }),
      links: [
        { label: m['footer.info.contacts']({}, { locale }), href: `${LANDING}/contacts` },
        { label: m['footer.info.privacy']({}, { locale }), href: `${LANDING}/privacy` },
      ],
    },
    {
      title: m['footer.resources.title']({}, { locale }),
      links: [
        { label: m['footer.resources.status']({}, { locale }), href: `${LANDING}/status` },
        { label: m['footer.resources.faq']({}, { locale }), href: `${LANDING}/support` },
      ],
    },
  ];

  const socials: SiteFooterSocial[] = [
    {
      label: m['footer.social.telegram']({}, { locale }),
      href: 'https://t.me/fasberry',
      icon: 'telegram',
    },
  ];

  return (
    <SiteFooter
      logo={
        <a href={publicEnv.siteUrl} className="flex h-14 w-fit items-center gap-2">
          <img
            src="/favicon-full.png"
            alt=""
            width={40}
            height={40}
            className="size-10 shrink-0 object-contain"
          />
          <span className="flex items-baseline gap-1.5 self-end font-[PIXY] text-3xl">
            Fasberry
            <span className="relative top-[0.16em] text-base text-neutral-400">wiki</span>
          </span>
        </a>
      }
      columns={columns}
      socials={socials}
      warning={m['footer.warning']({}, { locale })}
    />
  );
}
