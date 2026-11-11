import { i18nProvider } from 'fumadocs-ui/i18n';
import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import { RootProvider } from 'fumadocs-ui/provider/next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import { getViewer } from '@/lib/auth';
import { getPageTree } from '@/lib/content/pages';
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
import './global.css';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
});

export async function generateMetadata() {
  return buildRootMetadata(await getLocale());
}

export const dynamic = 'force-dynamic';

export default async function Layout({ children }: LayoutProps<'/'>) {
  const locale = await getLocale();
  const theme = await getServerTheme();
  const options = baseOptions();
  const viewer = await getViewer();

  return (
    <html
      lang={locale}
      className={cn(inter.className, theme)}
      style={{ colorScheme: theme }}
      suppressHydrationWarning
    >
      <body className="flex flex-col min-h-screen">
        <Script
          src="https://umami.fasberry.fun/script.js"
          data-website-id="dd3d8a0c-1c06-4a52-b00d-29ca926d949e"
          data-domains="wiki.fasberry.fun"
          strategy="afterInteractive"
        />
        <RootProvider
          i18n={i18nProvider(locale === 'ru' ? translations : defaultTranslations)}
          theme={{ enabled: false }}
        >
          <ReatomProvider initialTheme={theme}>
            <LocaleSync locale={locale} />
            <ViewerSync viewer={viewer} />
            <DocsLayout
              tree={await getPageTree(locale)}
              {...options}
              nav={{ ...options.nav, mode: 'top' }}
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
