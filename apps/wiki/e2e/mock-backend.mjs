import http from 'node:http';

/**
 * Stand-in for the Fasberry backend during e2e runs: it answers `/wiki/access` from the
 * `e2e-role` cookie, so a test can be an editor, a reader or an anonymous visitor.
 */
const AVATAR = 'https://volume.fasberry.fun/avatars/distribate-sr-distribate-ffPT.png';

const USERS = {
  editor: { canEdit: true, id: 'editor', name: 'editor', nickname: 'editor' },
  viewer: { canEdit: false, id: 'reader', name: 'reader', nickname: 'reader' },
  anon: { canEdit: false, id: null, name: null, nickname: null },
};

const port = Number(process.env.MOCK_PORT ?? 4545);

http
  .createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');
    const role = (request.headers.cookie ?? '').match(/e2e-role=(editor|viewer|anon)/)?.[1];
    const user = USERS[role ?? 'anon'];

    response.setHeader('content-type', 'application/json');

    if (url.pathname === '/wiki/access') {
      response.end(JSON.stringify({ data: user }));
      return;
    }

    if (url.pathname.startsWith('/server/player/')) {
      const nickname = url.pathname.split('/').pop();
      response.end(JSON.stringify({ data: { nickname, avatar: AVATAR } }));
      return;
    }

    if (url.pathname === '/servers-with-map') {
      response.end(
        JSON.stringify({
          data: [
            { name: 'Bisquite', value: 'bisquite', href: '', img: '' },
            { name: 'Muffin', value: 'muffin', href: '', img: '' },
          ],
        }),
      );
      return;
    }

    response.statusCode = 404;
    response.end('{}');
  })
  .listen(port, '127.0.0.1', () => console.log(`e2e backend mock on ${port}`));
