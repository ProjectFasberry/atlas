import { createGetUrl } from 'fumadocs-core/source';
import { pagePath } from '@/lib/content/default-server';

export const appName = 'Fasberry Wiki';
export const docsImageRoute = '/og/docs';
export const docsContentRoute = '/llms.mdx/docs';

const getContentUrl = createGetUrl(docsContentRoute);

export function getPageMarkdownUrl(server: string, slug: string) {
  const segments = [...pagePath(server, slug), 'content.md'];
  return { segments, url: getContentUrl(segments) };
}

const getImageUrl = createGetUrl(docsImageRoute);

export function getPageImageUrl(server: string, slug: string) {
  const segments = [...pagePath(server, slug), 'image.png'];
  return { segments, url: getImageUrl(segments) };
}
