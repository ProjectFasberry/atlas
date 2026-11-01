import sanitizeHtml from 'sanitize-html';
import TurndownService from 'turndown';

const ALLOWED_TAGS = [
  'p',
  'br',
  'h2',
  'h3',
  'h4',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'del',
  'code',
  'pre',
  'blockquote',
  'ul',
  'ol',
  'li',
  'a',
  'img',
  'hr',
  'figure',
  'figcaption',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'sup',
  'sub',
];

export function sanitizeContent(html: string) {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height', 'loading'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    transformTags: {
      a: (tagName, attribs) => {
        const external = /^https?:/i.test(attribs.href || '');
        return {
          tagName,
          attribs: external
            ? { ...attribs, rel: 'noopener noreferrer', target: '_blank' }
            : attribs,
        };
      },
    },
  });
}

export function stripHtml(html: string) {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, ' ').trim();
}

export function slugifyHeading(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export type TocItem = { title: string; url: string; depth: number };

export function withHeadingIds(html: string): { html: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  const seen = new Map<string, number>();

  const result = html.replace(
    /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/g,
    (match, level: string, attrs: string, inner: string) => {
      const title = stripHtml(inner);
      if (!title) return match;

      const existing = /id="([^"]+)"/.exec(attrs)?.[1];
      let id = existing || slugifyHeading(title) || 'section';
      const count = seen.get(id) ?? 0;
      seen.set(id, count + 1);
      if (count > 0) id = `${id}-${count}`;

      toc.push({ title, url: `#${id}`, depth: Number(level) });

      const nextAttrs = existing ? attrs : `${attrs} id="${id}"`;
      return `<h${level}${nextAttrs}>${inner}</h${level}>`;
    },
  );

  return { html: result, toc };
}

const turndown = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
});

/** HTML -> markdown, used for the `.md` versions and the llms endpoints. */
export function toMarkdown(html: string) {
  return turndown.turndown(html).trim();
}
