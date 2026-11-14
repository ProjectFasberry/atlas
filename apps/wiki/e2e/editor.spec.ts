import { expect, test } from '@playwright/test';
import pg from 'pg';
import { actAs, E2E_ORIGIN } from './utils';

test.describe('editor access', () => {
  test('hides the badge and forbids saving for an anonymous visitor', async ({ context, page, request }) => {
    await page.goto('/armor');
    await expect(page.getByTestId('user-menu')).toHaveCount(0);
    await expect(page.getByTestId('edit-page')).toHaveCount(0);

    const response = await request.put('/api/wiki/pages/armor', {
      data: { title: 'Hacked', html: '<p>nope</p>' },
    });
    expect(response.status()).toBe(403);
  });

  test('shows the badge but not the editor chip for a reader', async ({ context, page }) => {
    await actAs(context, 'viewer');
    await page.goto('/armor');

    await expect(page.getByTestId('user-menu')).toBeVisible();
    await page.getByTestId('user-menu').click();
    await expect(page.getByTestId('editor-chip')).toHaveCount(0);
    await expect(page.getByTestId('edit-page')).toHaveCount(0);
  });

  test('lets an editor change a page and keeps a revision', async ({ context, page }) => {
    await actAs(context, 'editor');
    await page.goto('/armor');

    await page.getByTestId('user-menu').click();
    await expect(page.getByTestId('editor-chip')).toBeVisible();
    await page.keyboard.press('Escape');

    await page.getByTestId('edit-page').click();
    const title = page.getByTestId('page-title');
    await expect(title).toHaveValue('E2E Броня');
    await title.fill('E2E Броня (правка)');

    await Promise.all([page.waitForLoadState('networkidle'), page.getByTestId('save-page').click()]);
    await expect(page.locator('h1')).toContainText('E2E Броня (правка)');

    const databaseUrl = process.env.E2E_DATABASE_URL;
    if (databaseUrl) {
      const client = new pg.Client({ connectionString: databaseUrl });
      await client.connect();
      try {
        const revisions = await client.query('select title from wiki_revisions where slug = $1', [
          'armor',
        ]);
        expect(revisions.rows.map((row) => row.title)).toContain('E2E Броня (правка)');
      } finally {
        await client.end();
      }
    }

    // restore the fixture title, so the page tests keep their expectation
    await page.goto('/armor');
    await page.getByTestId('edit-page').click();
    await page.getByTestId('page-title').fill('E2E Броня');
    await Promise.all([
      page.waitForLoadState('networkidle'),
      page.getByTestId('save-page').click(),
    ]);
    await expect(page.locator('h1')).toContainText('E2E Броня');
  });

  test('writes to the server of the page', async ({ context, page }) => {
    await actAs(context, 'editor');
    await page.goto('/muffin/armor');

    await page.getByTestId('edit-page').click();
    await page.getByTestId('page-title').fill('E2E Броня Маффина (правка)');
    await Promise.all([page.waitForLoadState('networkidle'), page.getByTestId('save-page').click()]);
    await expect(page.locator('h1')).toContainText('E2E Броня Маффина (правка)');

    const databaseUrl = process.env.E2E_DATABASE_URL;
    if (databaseUrl) {
      const client = new pg.Client({ connectionString: databaseUrl });
      await client.connect();
      try {
        const revisions = await client.query(
          'select server, title from wiki_revisions where slug = $1 order by id',
          ['armor'],
        );
        expect(
          revisions.rows.some(
            (row) => row.server === 'muffin' && row.title === 'E2E Броня Маффина (правка)',
          ),
        ).toBe(true);
        const pages = await client.query(
          'select server, title from wiki_pages where slug = $1 order by server',
          ['armor'],
        );
        expect(pages.rows).toEqual([
          { server: 'bisquite', title: 'E2E Броня' },
          { server: 'muffin', title: 'E2E Броня Маффина (правка)' },
        ]);
      } finally {
        await client.end();
      }
    }

    // the default server keeps its own article
    await page.goto('/armor');
    await expect(page.locator('h1')).toContainText('E2E Броня');

    // restore the fixture title for the next run
    await page.goto('/muffin/armor');
    await page.getByTestId('edit-page').click();
    await page.getByTestId('page-title').fill('E2E Броня Маффина');
    await Promise.all([page.waitForLoadState('networkidle'), page.getByTestId('save-page').click()]);
    await expect(page.locator('h1')).toContainText('E2E Броня Маффина');
  });
});
