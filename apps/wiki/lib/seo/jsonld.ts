import { publicEnv } from '@/lib/env/public';
import { ORGANIZATION, SITE_LANGUAGE, SITE_NAME } from '@/lib/seo/site';

type ArticleJsonLdInput = {
  title: string;
  description: string;
  url: string;
  image: string;
  updatedAt: Date;
};

/** Structured data of the overview page: the site itself and its publisher. */
export function homeJsonLd(description: string) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${publicEnv.siteUrl}/#website`,
        name: SITE_NAME,
        url: publicEnv.siteUrl,
        inLanguage: SITE_LANGUAGE,
        description,
        publisher: { '@id': `${publicEnv.siteUrl}/#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${publicEnv.siteUrl}/api/search?query={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
      ORGANIZATION,
    ],
  };
}

/** Structured data of a single wiki page. */
export function articleJsonLd({ title, description, url, image, updatedAt }: ArticleJsonLdInput) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: title,
        description,
        url,
        mainEntityOfPage: url,
        inLanguage: SITE_LANGUAGE,
        dateModified: updatedAt.toISOString(),
        image,
        isPartOf: { '@id': `${publicEnv.siteUrl}/#website` },
        publisher: ORGANIZATION,
      },
      ORGANIZATION,
    ],
  };
}
