import TurndownService from 'turndown';

const turndown = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
});

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function parseAttrs(raw) {
  const attrs = {};
  const re = /([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{([^}]*)\})/g;
  let match = re.exec(raw);
  while (match) {
    attrs[match[1]] = match[2] ?? match[3] ?? match[4] ?? '';
    match = re.exec(raw);
  }
  return attrs;
}

/**
 * Wiki MDX components -> plain HTML the editor understands:
 * <WikiImage /> becomes <img>, <Cards><Card /></Cards> becomes a list of links.
 */
export function jsxToHtml(html) {
  return html
    .replace(/<WikiImage\b([^>]*?)\/>/g, (_, raw) => {
      const attrs = parseAttrs(raw);
      if (!attrs.src) return '';

      const parts = [`src="${escapeAttr(attrs.src)}"`];
      if (attrs.alt) parts.push(`alt="${escapeAttr(attrs.alt)}"`);
      if (attrs.width) parts.push(`width="${escapeAttr(attrs.width)}"`);

      return `<img ${parts.join(' ')}>`;
    })
    .replace(/<Cards>([\s\S]*?)<\/Cards>/g, (_, inner) => {
      const cards = [...inner.matchAll(/<Card\b([^>]*?)\/>/g)].map((match) => parseAttrs(match[1]));
      if (cards.length === 0) return '';

      const items = cards.map((card) => {
        const href = card.href || '#';
        const label = `<a href="${escapeAttr(href)}">${escapeAttr(card.title || href)}</a>`;
        return `<li>${label}${card.description ? ` - ${escapeAttr(card.description)}` : ''}</li>`;
      });

      return `<ul>${items.join('')}</ul>`;
    });
}

export function htmlToMarkdown(html) {
  return turndown.turndown(html).trim();
}
