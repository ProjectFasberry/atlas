import http from 'node:http';

/**
 * Fasberry api stand-in for the landing e2e run. Only the endpoints the pages read on
 * load are answered; everything else 404s, so an unexpected call is visible in the test.
 */
const routes = {
  '/rules/tags': () => ({ data: [{ id: 1, title: 'E2E' }] }),
  '/rules/list': () => ({
    data: [
      {
        category: 'E2E правила',
        updated_at: '2026-01-01T00:00:00.000Z',
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'E2E правило для теста' }],
            },
          ],
        },
      },
    ],
  }),
  '/modpack/list': () => ({
    data: [{ name: 'E2E Modpack', version: '1.0.0', url: 'https://example.test/modpack.zip' }],
  }),
};

const port = Number(process.env.MOCK_PORT ?? 4546);

http
  .createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');
    const route = routes[url.pathname];

    response.setHeader('content-type', 'application/json');
    response.setHeader('access-control-allow-origin', request.headers.origin ?? '*');
    response.setHeader('access-control-allow-credentials', 'true');

    if (request.method === 'OPTIONS') {
      response.statusCode = 204;
      response.end();
      return;
    }

    if (!route) {
      response.statusCode = 404;
      response.end(JSON.stringify({ error: 'not found' }));
      return;
    }

    response.end(JSON.stringify(route()));
  })
  .listen(port, '127.0.0.1', () => console.log(`taurus api mock on ${port}`));
