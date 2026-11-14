import { i18nProvider } from 'fumadocs-ui/i18n';
import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import {
  SidebarCollapseTrigger,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from 'fumadocs-ui/layouts/notebook/slots/sidebar';
import { RootProvider } from 'fumadocs-ui/provider/next';
import { Golos_Text } from 'next/font/google';
import { headers } from 'next/headers';
import Script from 'next/script';
import { getViewer } from '@/lib/auth';
import { getPageTree, listServerSlugs } from '@/lib/content/pages';
import { resolveRoute } from '@/lib/content/default-server';
import { getServers } from '@/lib/content/servers';
import { getLocale } from '@/lib/i18n/locale';
import { buildRootMetadata } from '@/lib/seo/metadata';
import { getServerTheme } from '@/lib/theme';
import { baseOptions, defaultTranslations, translations } from '@/lib/ui/layout';
import { cn } from '@/lib/utils/cn';
import { m } from '@/paraglide/messages';
import { Footer } from '@/shared/components/app/footer';
import { ViewerSync } from '@/shared/components/app/viewer-sync';
import { LocaleSync } from '@/shared/components/app/locale-sync';
import { ReatomProvider } from '@/shared/components/app/reatom-provider';
import { SidebarLinks } from '@/shared/ui/sidebar-links';
import { SidebarSection } from '@/shared/ui/sidebar-section';
import { WikiSidebar } from '@/shared/ui/wiki-sidebar';
import './global.css';

/** Same family as minotaur: Golos Text, self-hosted by next/font. */
const golos = Golos_Text({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-golos',
});

export async function generateMetadata() {
  return buildRootMetadata(await getLocale());
}

export const dynamic = 'force-dynamic';

export default async function Layout({ children }: LayoutProps<'/'>) {
  const locale = await getLocale();
  const theme = await getServerTheme();
  const viewer = await getViewer();
  const servers = await getServers();
  const slugs = await listServerSlugs();

  // root layouts get no route params, the proxy passes the pathname along
  const pathname = (await headers()).get('x-wiki-path') ?? '/';
  const segments = pathname
    .split('/')
    .filter(Boolean)
    .map((segment) => decodeURIComponent(segment));
  const { server } = resolveRoute(segments, servers);

  const options = baseOptions();

  return (
    <html
      lang={locale}
      className={cn(golos.variable, theme)}
      style={{ colorScheme: theme }}
      suppressHydrationWarning
    >
      <body className="flex flex-col min-h-screen">
        <Script
          src="https://umami.fasberry.fun/k7.js"
          data-website-id="dd3d8a0c-1c06-4a52-b00d-29ca926d949e"
          data-domains="wiki.fasberry.fun"
          strategy="afterInteractive"
        />
        <RootProvider
          i18n={i18nProvider(locale === 'ru' ? translations : defaultTranslations)}
          theme={{ enabled: false }}
        >
          <ReatomProvider initialTheme={theme} servers={servers} slugs={slugs}>
            <LocaleSync locale={locale} />
            <ViewerSync viewer={viewer} />
            <DocsLayout
              tree={await getPageTree(server, locale)}
              {...options}
              nav={{ ...options.nav, mode: 'top' }}
              slots={{
                ...options.slots,
                sidebar: {
                  provider: SidebarProvider,
                  root: WikiSidebar,
                  trigger: SidebarTrigger,
                  collapseTrigger: SidebarCollapseTrigger,
                  useSidebar,
                },
              }}
              sidebar={{
                collapsible: false,
                components: { Separator: SidebarSection },
                banner: (
                  <SidebarLinks
                    back={m['sidebar.back']({}, { locale })}
                    account={m['sidebar.account']({}, { locale })}
                  />
                ),
              }}
            >
              {children}
            </DocsLayout>
            <Footer />
          </ReatomProvider>
        </RootProvider>
      </body>
    </html>
  );
}
