import { expect, test } from '@playwright/test';

test.describe('content and metadata', () => {
  test('renders the overview and an article from the database', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('E2E Обзор');

    await page.goto('/armor');
    await expect(page.locator('h1')).toContainText('E2E Броня');
    await expect(page.locator('body')).toContainText('Есть пять новых видов брони');
    await expect(page.getByText('Аспекты игры').first()).toBeVisible();
  });

  test('answers 404 for an unknown slug', async ({ page }) => {
    const response = await page.goto('/no-such-page');
    expect(response?.status()).toBe(404);
  });

  test('sitemap and robots are generated from the database', async ({ request }) => {
    const sitemap = await request.get('/sitemap.xml');
    expect(sitemap.status()).toBe(200);
    const sitemapBody = await sitemap.text();
    expect(sitemapBody).toContain('/armor');
    expect(sitemapBody).toContain('/mobs');

    const robots = await request.get('/robots.txt');
    expect(robots.status()).toBe(200);
    expect(await robots.text()).toContain('sitemap.xml');
  });

  test('llms endpoints list the pages', async ({ request }) => {
    const index = await request.get('/llms.txt');
    expect(index.status()).toBe(200);
    expect(await index.text()).toContain('E2E Броня');

    const full = await request.get('/llms-full.txt');
    expect(full.status()).toBe(200);
    expect(await full.text()).toContain('Есть пять новых видов брони');
  });

  test('serves the markdown version of a page', async ({ request }) => {
    const explicit = await request.get('/armor.md');
    expect(explicit.status()).toBe(200);
    expect(explicit.headers()['content-type']).toContain('markdown');
    expect(await explicit.text()).toContain('E2E Броня');

    const negotiated = await request.get('/armor', { headers: { accept: 'text/plain' } });
    expect(negotiated.status()).toBe(200);
    expect(negotiated.headers()['content-type']).toContain('markdown');
    expect(negotiated.headers()['vary'] ?? '').toContain('Accept');
    expect(await negotiated.text()).toContain('E2E Броня');
  });

  test('renders the og image', async ({ request }) => {
    const response = await request.get('/og/docs/armor/image.png');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('image/png');
  });
});
