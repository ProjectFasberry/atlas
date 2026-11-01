import { siteUrl } from '@/lib/shared';

export const SITE_NAME = 'Fasberry Wiki';
export const SITE_LOCALE = 'ru_RU';
export const SITE_LANGUAGE = 'ru';
export const SITE_PUBLISHER = 'Fasberry';
export const SITE_PUBLISHER_URL = 'https://fasberry.fun';

export const SITE_KEYWORDS = [
  'Fasberry',
  'Майнкрафт',
  'Minecraft',
  'вики',
  'сервер',
  'гайд',
  'экономика',
  'регионы',
  'работа',
  'броня',
];

/** Default card, also the fallback for pages without their own image. */
export const DEFAULT_OG_IMAGE = '/og/docs/image.png';
export const OG_SIZE = { width: 1200, height: 630 };

export const SOCIAL_LINKS = ['https://t.me/fasberry'];

export const ORGANIZATION = {
  '@type': 'Organization',
  '@id': `${siteUrl}/#organization`,
  name: SITE_PUBLISHER,
  url: SITE_PUBLISHER_URL,
  sameAs: SOCIAL_LINKS,
};
