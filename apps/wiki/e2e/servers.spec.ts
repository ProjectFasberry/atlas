import { expect, test } from '@playwright/test';

test.describe('servers', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('opens on the default server and switches from the header', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('E2E Обзор');

    const switcher = page.getByTestId('server-switcher').first();
    await expect(switcher).toBeVisible();
    await expect(switcher).toContainText('Bisquite');

    await switcher.click();
    await page.getByRole('menuitem', { name: /Muffin/ }).click();

    await expect(page).toHaveURL(/\/muffin$/);
    await expect(page.locator('h1')).toContainText('E2E Маффин');
  });

  test('keeps the article on the server that has it', async ({ page }) => {
    await page.goto('/armor');
    await page.getByTestId('server-switcher').first().click();
    await page.getByRole('menuitem', { name: /Muffin/ }).click();

    await expect(page).toHaveURL(/\/muffin\/armor$/);
    await expect(page.locator('h1')).toContainText('E2E Броня Маффина');
    await expect(page.locator('#nd-sidebar')).toContainText('E2E Броня Маффина');
    await expect(page.locator('#nd-sidebar')).not.toContainText('E2E Мобы');
  });

  test('redirects the explicit default prefix to the short url', async ({ request }) => {
    const response = await request.get('/bisquite/armor', { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers()['location']).toContain('/armor');
  });

  test('scopes search to the server of the page', async ({ request }) => {
    const muffin = await request.get('/api/search?query=%D0%9C%D0%B0%D1%84%D1%84%D0%B8%D0%BD%D0%B0', {
      headers: { referer: 'http://127.0.0.1:3100/muffin/armor' },
    });
    expect(muffin.status()).toBe(200);
    const results = (await muffin.json()) as { url: string }[];
    expect(results.some((item) => item.url.startsWith('/muffin'))).toBe(true);
  });

  test('serves the markdown and og image of a server page', async ({ request }) => {
    const markdown = await request.get('/muffin/armor.md');
    expect(markdown.status()).toBe(200);
    expect(await markdown.text()).toContain('E2E Броня Маффина');

    const image = await request.get('/og/docs/muffin/armor/image.png');
    expect(image.status()).toBe(200);
    expect(image.headers()['content-type']).toContain('image/png');

    const sitemap = await request.get('/sitemap.xml');
    expect(await sitemap.text()).toContain('/muffin/armor');
  });

  test('renders the shared footer with the wiki logo', async ({ page }) => {
    await page.goto('/armor');
    const footer = page.locator('footer');
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toContainText('Fasberry');
    await expect(footer).toContainText('wiki');
    await expect(footer).toContainText('О проекте');
  });
});

test.describe('mobile navigation', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('opens the shared bottom sheet instead of the side drawer', async ({ page }) => {
    await page.goto('/armor');
    await page.getByRole('button', { name: 'Открыть боковую панель' }).click();

    const sheet = page.locator('[data-scope="drawer"][data-part="content"]');
    await expect(sheet).toBeVisible();

    const box = await sheet.boundingBox();
    expect(box?.width).toBeGreaterThan(300);
    expect(box?.y).toBeGreaterThan(100);
    expect((box?.y ?? 0) + (box?.height ?? 0)).toBeGreaterThan(800);

    await expect(page.locator('#nd-sidebar-mobile')).toBeHidden();
    await expect(sheet.getByTestId('server-switcher')).toBeVisible();
    await expect(sheet.getByTestId('theme-toggle')).toBeVisible();
    await expect(sheet.getByTestId('language-menu')).toBeVisible();
  });

  test('keeps the header controls usable inside the sheet', async ({ page }) => {
    await page.goto('/armor');
    await page.getByRole('button', { name: 'Открыть боковую панель' }).click();

    const sheet = page.locator('[data-scope="drawer"][data-part="content"]');
    await expect(sheet).toBeVisible();

    await sheet.getByTestId('theme-toggle').click();
    await expect(page.locator('html')).toHaveClass(/light/);

    await sheet.getByTestId('language-menu').click();
    await page.getByRole('menuitem', { name: 'English' }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
});
