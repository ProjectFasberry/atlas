import { ImageZoom } from 'fumadocs-ui/components/image-zoom';
import { Fragment } from 'react';

/** Collects `name="value"` pairs from the inside of an html tag. */
function attributes(raw: string) {
  const list: Record<string, string> = {};
  for (const match of raw.matchAll(/([\w-]+)\s*=\s*"([^"]*)"/g)) {
    list[match[1]] = match[2];
  }
  return list;
}

/**
 * Article HTML with zoomable images. Content is stored as plain HTML, so the
 * string is split around `<img>` tags: everything else is rendered through
 * `dangerouslySetInnerHTML`, images go through the fumadocs `ImageZoom`.
 */
export function ArticleHtml({ html }: { html: string }) {
  const parts = html.split(/(<img\b[^>]*>)/i);

  return (
    <>
      {parts.map((part, index) => {
        if (!/^<img\b/i.test(part)) {
          // biome-ignore lint/suspicious/noArrayIndexKey: segments of a split string have no ids
          return <div key={index} dangerouslySetInnerHTML={{ __html: part }} />;
        }

        const attrs = attributes(part);
        const width = Number(attrs.width);
        const height = Number(attrs.height);

        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: segments of a split string have no ids
          <Fragment key={index}>
            <ImageZoom src={attrs.src} caption={attrs.alt || undefined}>
              {/* our own <img>, so no next/image size requirements */}
              <img
                src={attrs.src}
                alt={attrs.alt || ''}
                width={Number.isFinite(width) ? width : undefined}
                height={Number.isFinite(height) ? height : undefined}
              />
            </ImageZoom>
          </Fragment>
        );
      })}
    </>
  );
}
