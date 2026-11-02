import { type BrowserContext, expect, test } from '@playwright/test';
import { E2E_ORIGIN } from './utils';

const setCookie = (context: BrowserContext, name: string, value: string) =>
  context.addCookies([{ name, value, url: E2E_ORIGIN }]);

test.describe('locale', () => {
  test('defaults to Russian', async ({ page }) => {
    await page.goto('/armor');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
    await expect(page.locator('h1')).toContainText('E2E Броня');
  });

  test('serves the fresh translation for the English cookie', async ({ page, context }) => {
    await setCookie(context, 'locale', 'en');
    await page.goto('/armor');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('h1')).toContainText('E2E Armour');
    await expect(page.getByText('Game aspects').first()).toBeVisible();
  });

  test('switches the language from the header', async ({ page }) => {
    await page.goto('/armor');
    await page.getByTestId('language-switch').getByRole('button', { name: 'EN' }).click();

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('h1')).toContainText('E2E Armour');
  });
});

test.describe('theme', () => {
  test('renders the theme from the cookie without a flash', async ({ page, context }) => {
    await page.goto('/armor');
    await expect(page.locator('html')).toHaveClass(/dark/);

    await setCookie(context, 'theme', 'light');
    await page.goto('/armor');
    await expect(page.locator('html')).toHaveClass(/light/);
  });

  test('stores the choice when switched from the header', async ({ page, context }) => {
    await page.goto('/armor');
    await page.getByTestId('theme-switch').getByRole('button').first().click();

    await expect(page.locator('html')).toHaveClass(/light/);
    const cookies = await context.cookies();
    expect(cookies.find((cookie) => cookie.name === 'theme')?.value).toBe('light');
  });
});
