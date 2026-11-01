import type { Metadata } from 'next';
import { publicEnv } from '@/lib/env/public';
import {
  DEFAULT_OG_IMAGE,
  OG_SIZE,
  SITE_KEYWORDS,
  SITE_LOCALE,
  SITE_NAME,
  SITE_PUBLISHER,
} from '@/lib/seo/site';
import { m } from '@/paraglide/messages';
import type { Locale } from '@/paraglide/runtime';

/** Metadata of the whole site, applied by the root layout. */
export function buildRootMetadata(locale: Locale): Metadata {
  const description = m['seo.description']({}, { locale });

  return {
    metadataBase: new URL(publicEnv.siteUrl),
    applicationName: SITE_NAME,
    title: {
      default: SITE_NAME,
      template: `%s | ${SITE_NAME}`,
    },
    description,
    keywords: SITE_KEYWORDS,
    authors: [{ name: SITE_PUBLISHER, url: publicEnv.siteUrl }],
    creator: SITE_PUBLISHER,
    publisher: SITE_PUBLISHER,
    category: 'games',
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: SITE_LOCALE,
      url: publicEnv.siteUrl,
      title: SITE_NAME,
      description,
      images: [{ url: DEFAULT_OG_IMAGE, ...OG_SIZE, alt: SITE_NAME }],
    },
    twitter: {
      card: 'summary_large_image',
      title: SITE_NAME,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    formatDetection: { telephone: false },
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
    appleWebApp: { title: SITE_PUBLISHER },
  };
}

type PageMetadataInput = {
  title: string;
  description: string;
  image: string;
  url: string;
  updatedAt: Date;
};

/** Metadata of a single wiki page. */
export function pageMetadata({
  title,
  description,
  image,
  url,
  updatedAt,
}: PageMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title,
      description,
      siteName: SITE_NAME,
      locale: SITE_LOCALE,
      modifiedTime: updatedAt.toISOString(),
      images: [{ url: image, ...OG_SIZE, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    robots: { index: true, follow: true },
  };
}
