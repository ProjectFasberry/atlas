import { createGetUrl } from 'fumadocs-core/source';

export const appName = 'Fasberry Wiki';
export const docsRoute = '/';
export const docsImageRoute = '/og/docs';
export const docsContentRoute = '/llms.mdx/docs';
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wiki.fasberry.fun';

const getContentUrl = createGetUrl(docsContentRoute);

export function getPageMarkdownUrl(slug: string) {
  const segments = [...(slug ? slug.split('/') : []), 'content.md'];

  return { segments, url: getContentUrl(segments) };
}

const getImageUrl = createGetUrl(docsImageRoute);

export function getPageImageUrl(slug: string) {
  const segments = [...(slug ? slug.split('/') : []), 'image.png'];

  return { segments, url: getImageUrl(segments) };
}
