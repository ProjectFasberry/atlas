# End-to-end tests

Playwright runs the app against a production build, a throwaway database and a mock backend
(`e2e/mock-backend.mjs`), so nothing here touches production data or the real API.

```bash
# one time: a local database for the tests
docker run -d --name wiki-e2e-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=wiki_e2e \
  -p 55432:5432 postgres:16-alpine

# first run in a fresh checkout
pnpm --filter wiki test:e2e:install   # downloads Chromium

# run
E2E_DATABASE_URL=postgres://postgres:postgres@127.0.0.1:55432/wiki_e2e \
  pnpm --filter wiki test:e2e
```

What happens on start (`e2e/serve.mjs`): the drizzle migrations are applied, `e2e/seed.mjs`
upserts the fixtures (three pages, one fresh English translation, a translated sidebar group),
the mock backend listens on `4545` and `next start` serves on `3100`.

The mock answers `/wiki/access` from the `e2e-role` cookie (`editor`, `viewer` or anonymous),
which is how a test picks the user: `actAs(context, 'editor')` in `e2e/utils.ts`.

Covered: content and metadata, sitemap/robots/llms, markdown negotiation, the og image, locale
and theme, the search API and the editor (access rules, saving, revisions).
