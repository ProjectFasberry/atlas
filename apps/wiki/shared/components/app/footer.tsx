import { publicEnv } from '@/lib/env/public';
import { getLocale } from '@/lib/i18n/locale';
import { m } from '@/paraglide/messages';

const LANDING = 'https://fasberry.fun';

type Column = {
  title: string;
  links: { label: string; href: string }[];
};

/**
 * Short site footer: the same blocks as on the main site (about, info, resources)
 * plus the Minecraft disclaimer. Server-rendered, so it follows the reading locale.
 */
export async function Footer() {
  const locale = await getLocale();

  const columns: Column[] = [
    {
      title: m['footer.about.title']({}, { locale }),
      links: [
        { label: m['footer.about.news']({}, { locale }), href: `${LANDING}/news` },
        { label: m['footer.about.status']({}, { locale }), href: 'https://status.fasberry.fun' },
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

  return (
    <footer className="mt-auto border-t border-fd-border/70 bg-fd-muted/30">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 md:flex-row md:justify-between">
        <div className="flex flex-col gap-3">
          <a href={publicEnv.siteUrl} className="flex w-fit items-center gap-2">
            <img
              src="/favicon-full.png"
              alt=""
              width={28}
              height={28}
              className="size-7 shrink-0 object-contain"
            />
            <span className="flex items-baseline gap-1.5">
              <span className="font-[PIXY] text-lg">Fasberry</span>
              <span className="font-[PIXY] text-xs text-fd-muted-foreground">wiki</span>
            </span>
          </a>
          <a
            href="https://t.me/fasberry"
            target="_blank"
            rel="noopener noreferrer"
            className="w-fit text-sm text-fd-muted-foreground transition-colors hover:text-fd-primary"
          >
            Telegram
          </a>
        </div>

        <nav className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:gap-10">
          {columns.map((column) => (
            <div key={column.title} className="flex min-w-0 flex-col gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-fd-muted-foreground">
                {column.title}
              </p>
              {column.links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="w-fit text-sm text-fd-foreground/80 transition-colors hover:text-fd-primary"
                >
                  {link.label}
                </a>
              ))}
            </div>
          ))}
        </nav>
      </div>

      <div className="border-t border-fd-border/60">
        <p className="mx-auto w-full max-w-6xl px-4 py-4 text-[11px] leading-relaxed text-fd-muted-foreground sm:px-6">
          {m['footer.warning']({}, { locale })}
        </p>
      </div>
    </footer>
  );
}
