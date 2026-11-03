import { type APIRequestContext, expect, test } from '@playwright/test';

const search = (request: APIRequestContext, query: string, locale: 'ru' | 'en') =>
  request.get(`/api/search?query=${encodeURIComponent(query)}`, {
    headers: { cookie: `locale=${locale}` },
  });

test.describe('search api', () => {
  test('indexes the page in the reading locale', async ({ request }) => {
    const english = await search(request, 'E2E', 'en');
    expect(english.status()).toBe(200);
    const englishResults = (await english.json()) as { content: string }[];
    expect(englishResults.map((item) => item.content)).toContain('E2E Armour');

    const russian = await search(request, 'E2E', 'ru');
    const russianResults = (await russian.json()) as { content: string }[];
    expect(russianResults.map((item) => item.content)).toContain('E2E Броня');
  });

  test('returns an empty list for empty and unmatched queries', async ({ request }) => {
    const empty = await request.get('/api/search?query=');
    expect(await empty.json()).toEqual([]);

    const missing = await request.get('/api/search?query=zzzz-not-a-page');
    expect(await missing.json()).toEqual([]);
  });
});
