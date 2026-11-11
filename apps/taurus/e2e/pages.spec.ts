import { type APIRequestContext, expect, test } from '@playwright/test';

/**
 * The landing is server rendered, so the pages are checked through the response text. A
 * browser adds nothing here: the interactive bits are the header menu, which needs a
 * browser and a much lighter dev server than `vike dev` gives us - see `e2e/README.md`.
 */
const text = async (request: APIRequestContext, path: string) => {
  const response = await request.get(path);
  return { response, body: await response.text() };
};

test.describe('landing pages', () => {
  test('renders the home page with the header and the footer', async ({ request }) => {
    const { response, body } = await text(request, '/');
    expect(response.status()).toBe(200);
    expect(body).toContain('Minecraft-проект: разные режимы');
    expect(body).toContain('Правила');
    expect(body).toContain('Конфиденциальность');
  });

  test('renders the join, news, community and faq sections', async ({ request }) => {
    const { response, body } = await text(request, '/');
    expect(response.status()).toBe(200);
    expect(body).toContain('Три шага до первого дня');
    expect(body).not.toContain('play.fasberry.fun');
    expect(body).toContain('Что нового');
    expect(body).toContain('Куда дальше');
    expect(body).toContain('Частые вопросы');
  });

  test('serves the static pages', async ({ request }) => {
    for (const path of ['/support', '/gallery', '/info/credits', '/status', '/start']) {
      const { response, body } = await text(request, path);
      expect(response.status(), path).toBe(200);
      expect(body, path).toContain('Fasberry');
    }
  });

  test('renders the rules from the api', async ({ request }) => {
    const { response, body } = await text(request, '/rules');
    expect(response.status()).toBe(200);
    expect(body).toContain('Правила проекта');
    expect(body).toContain('Содержание');
    expect(body).toContain('Поиск по правилам');
    expect(body).toContain('E2E правило для теста');
  });

  test('renders the support options', async ({ request }) => {
    const { response, body } = await text(request, '/support');
    expect(response.status()).toBe(200);
    expect(body).toContain('Как помочь проекту');
    expect(body).toContain('Чем занимается команда');
    expect(body).toContain('Скопировать ссылку');
  });

  test('renders the gallery heading and filters', async ({ request }) => {
    const { response, body } = await text(request, '/gallery');
    expect(response.status()).toBe(200);
    expect(body).toContain('Игровые моменты');
    expect(body).toContain('Смотреть кадры');
    expect(body).toContain('Природа');
  });

  test('renders the modpack list from the api', async ({ request }) => {
    const { response, body } = await text(request, '/modpack');
    expect(response.status()).toBe(200);
    expect(body).toContain('Играть через лаунчер');
    expect(body).toContain('E2E Modpack');
  });

  test('links the stable launcher download', async ({ request }) => {
    const { response, body } = await text(request, '/start');
    expect(response.status()).toBe(200);
    expect(body).toContain('/releases/download/windows-x86_64');
    expect(body).not.toContain('/releases/download/darwin-aarch64');
  });

  test('answers 404 for an unknown page', async ({ request }) => {
    const { response } = await text(request, '/no-such-page');
    expect(response.status()).toBe(404);
  });
});
