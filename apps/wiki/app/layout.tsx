import { IconPencil } from '@tabler/icons-react';
import { i18nProvider } from 'fumadocs-ui/i18n';
import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import { RootProvider } from 'fumadocs-ui/provider/next';
import { Inter } from 'next/font/google';
import { getEditor } from '@/lib/auth';
import { getPageTree } from '@/lib/content/pages';
import { getLocale } from '@/lib/i18n/locale';
import { buildRootMetadata } from '@/lib/seo/metadata';
import { getServerTheme } from '@/lib/theme';
import { baseOptions, defaultTranslations, translations } from '@/lib/ui/layout';
import { cn } from '@/lib/utils/cn';
import { m } from '@/paraglide/messages';
import { Footer } from '@/shared/components/app/footer';
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
  const editor = await getEditor();

  return (
    <html
      lang={locale}
      className={cn(inter.className, theme)}
      style={{ colorScheme: theme }}
      suppressHydrationWarning
    >
      <body className="flex flex-col min-h-screen">
        <RootProvider
          i18n={i18nProvider(locale === 'ru' ? translations : defaultTranslations)}
          theme={{ enabled: false }}
        >
          <ReatomProvider>
            <LocaleSync locale={locale} />
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
            {editor ? (
              <span
                title={`${m['layout.editor-badge-title']({}, { locale })}${editor.name ? `: ${editor.name}` : ''}`}
                className="
                  pointer-events-none fixed bottom-4 right-4 z-40 inline-flex
                  items-center gap-1.5 rounded-full border border-fd-primary/30 bg-fd-primary/10
                  px-2.5 py-1 text-xs font-medium text-fd-primary backdrop-blur
                "
              >
                <IconPencil size={13} stroke={2} aria-hidden />
                {m['layout.editor-badge']({}, { locale })}
              </span>
            ) : null}
          </ReatomProvider>
        </RootProvider>
      </body>
    </html>
  );
}
