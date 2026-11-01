import fs from 'node:fs/promises';
import path from 'node:path';
import { notFound } from 'next/navigation';
import { ImageResponse } from 'next/og';
import { getPage, pageDescription } from '@/lib/pages';

export const dynamic = 'force-dynamic';

/**
 * Emoji would make satori fetch the glyph from a CDN, which the container cannot
 * reach (Cloudflare is blocked there), so the card request would hang and fail.
 */
const plain = (value: string) =>
  value
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

const WIDTH = 1200;
const HEIGHT = 630;
const BRAND = '#4ade80';
/**
 * The hero art is https://volume.fasberry.fun/static/arts/bzzvanet-mp1jpg.jpg,
 * downscaled to the card size once and shipped with the app: no network call and
 * no 900 KB base64 string on every render.
 */
let hero: Promise<string | null> | null = null;

/**
 * Rasterising a 1200x630 card with a photo takes seconds on a small VM, which is
 * longer than a link-preview bot waits. Finished PNGs are kept per process, keyed
 * by the page revision, and the deploy warms them up (`make warm`).
 */
const cards = new Map<string, { key: string; png: Buffer }>();
const CARD_CACHE_LIMIT = 64;

export const cardCacheKey = (page: { updatedAt: Date; title: string }) =>
  `${page.updatedAt.toISOString()}|${page.title}`;

async function loadHero() {
  const bytes = await fs
    .readFile(path.join(process.cwd(), 'public', 'og-bg.jpg'))
    .catch(() => null);

  return bytes ? `data:image/jpeg;base64,${bytes.toString('base64')}` : null;
}

export async function GET(_req: Request, { params }: RouteContext<'/og/docs/[...slug]'>) {
  const { slug } = await params;
  const pageSlug = (slug ?? []).slice(0, -1).join('/');
  const page = await getPage(pageSlug);
  if (!page) notFound();

  const headers = {
    'Content-Type': 'image/png',
    'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
  };

  const key = cardCacheKey(page);
  const cached = cards.get(pageSlug);
  if (cached?.key === key) {
    return new Response(new Uint8Array(cached.png), { headers });
  }

  hero ??= loadHero();
  const background = await hero;

  const image = new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: '#0a0d0d',
        color: '#ffffff',
      }}
    >
      {background ? (
        <img
          src={background}
          width={WIDTH}
          height={HEIGHT}
          style={{ position: 'absolute', top: 0, left: 0, objectFit: 'cover' }}
          alt=""
        />
      ) : null}

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            'linear-gradient(180deg, rgba(10,13,13,0.15) 0%, rgba(10,13,13,0.75) 55%, rgba(10,13,13,0.97) 100%)',
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          justifyContent: 'flex-end',
          padding: '64px 72px',
          position: 'relative',
        }}
      >
        {page.section ? (
          <div
            style={{
              display: 'flex',
              alignSelf: 'flex-start',
              padding: '6px 18px',
              borderRadius: 999,
              border: `2px solid ${BRAND}`,
              color: BRAND,
              fontSize: 24,
              marginBottom: 24,
            }}
          >
            {plain(page.section)}
          </div>
        ) : null}

        <div style={{ display: 'flex', fontSize: 76, fontWeight: 800, lineHeight: 1.05 }}>
          {plain(page.title)}
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: 20,
            fontSize: 30,
            lineHeight: 1.35,
            color: 'rgba(255,255,255,0.78)',
            maxWidth: 940,
          }}
        >
          {plain(pageDescription(page, 130))}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginTop: 44,
            fontSize: 26,
            color: 'rgba(255,255,255,0.65)',
          }}
        >
          <div
            style={{
              display: 'flex',
              width: 56,
              height: 4,
              backgroundColor: BRAND,
              marginRight: 20,
            }}
          />
          <div style={{ display: 'flex', color: BRAND }}>wiki.fasberry.fun</div>
        </div>
      </div>
    </div>,
    {
      width: WIDTH,
      height: HEIGHT,
    },
  );

  const png = Buffer.from(await image.arrayBuffer());
  cards.set(pageSlug, { key, png });
  if (cards.size > CARD_CACHE_LIMIT) {
    const oldest = cards.keys().next().value;
    if (oldest !== undefined) cards.delete(oldest);
  }

  return new Response(new Uint8Array(png), { headers });
}
