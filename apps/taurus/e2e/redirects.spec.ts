import { expect, test } from '@playwright/test';

test.describe('redirects', () => {
  test('sends the wiki paths to the wiki site', async ({ request }) => {
    const index = await request.get('/wiki', { maxRedirects: 0 });
    expect(index.status()).toBeGreaterThanOrEqual(300);
    expect(index.status()).toBeLessThan(400);
    expect(index.headers()['location']).toBe('https://wiki.fasberry.fun/');

    const nested = await request.get('/wiki/armor', { maxRedirects: 0 });
    expect(nested.headers()['location']).toBe('https://wiki.fasberry.fun/armor');
  });

  test('sends the legal pages to the api', async ({ request }) => {
    const privacy = await request.get('/info/privacy', { maxRedirects: 0 });
    expect(privacy.headers()['location']).toBe('https://api.fasberry.fun/misc/privacy');

    const terms = await request.get('/info/terms', { maxRedirects: 0 });
    expect(terms.headers()['location']).toBe('https://api.fasberry.fun/misc/terms');
  });
});
