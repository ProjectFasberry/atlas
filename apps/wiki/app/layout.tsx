import { IconPencil } from '@tabler/icons-react';
import { i18nProvider } from 'fumadocs-ui/i18n';
import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import { RootProvider } from 'fumadocs-ui/provider/next';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { getEditor } from '@/lib/auth';
import { baseOptions, translations } from '@/lib/layout.shared';
import { getPageTree } from '@/lib/pages';
import { siteUrl } from '@/lib/shared';
import { ReatomProvider } from '@/shared/components/app/reatom-provider';
import { SidebarSection } from '@/shared/ui/sidebar-section';
import './global.css';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Fasberry Wiki',
    template: '%s | Fasberry Wiki',
  },
  description: 'Вики проекта Fasberry: механики сервера, экономика, аккаунт.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  manifest: '/site.webmanifest',
  appleWebApp: { title: 'Fasberry' },
};

export const dynamic = 'force-dynamic';

// the theme lives in lib/models/theme.ts; the script below sets the class before the
// first paint so there is no light flash on a dark theme
const initThemeScript = `(function(){var stored;try{stored=localStorage.getItem('theme')}catch(e){}var root=document.documentElement;var theme=stored==='light'||stored==='dark'?stored:'dark';root.classList.remove('light','dark');root.classList.add(theme);root.style.colorScheme=theme})()`;

export default async function Layout({ children }: LayoutProps<'/'>) {
  const options = baseOptions();
  const editor = await getEditor();

  return (
    <html lang="ru" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <script dangerouslySetInnerHTML={{ __html: initThemeScript }} />
        <RootProvider i18n={i18nProvider(translations)} theme={{ enabled: false }}>
          <ReatomProvider>
            <DocsLayout
              tree={await getPageTree()}
              {...options}
              nav={{ ...options.nav, mode: 'top' }}
              sidebar={{ collapsible: false, components: { Separator: SidebarSection } }}
            >
              {children}
            </DocsLayout>
            {editor ? (
              <span
                title={`Редактирование доступно${editor.name ? `: ${editor.name}` : ''}`}
                className="
                  pointer-events-none fixed bottom-4 right-4 z-40 inline-flex
                  items-center gap-1.5 rounded-full border border-fd-primary/30 bg-fd-primary/10
                  px-2.5 py-1 text-xs font-medium text-fd-primary backdrop-blur
                "
              >
                <IconPencil size={13} stroke={2} aria-hidden />
                Редактор
              </span>
            ) : null}
          </ReatomProvider>
        </RootProvider>
      </body>
    </html>
  );
}
