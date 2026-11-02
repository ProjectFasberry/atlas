# End-to-end tests

The landing is server rendered, so the suite drives it through real HTTP requests against
`vike dev` with a mocked Fasberry api: pages, the api-backed lists and the redirects from
`renderer/+config.ts`. No production service is touched.

```bash
# first run in a fresh checkout
pnpm --filter taurus test:e2e:install

# run
pnpm --filter taurus test:e2e
```

`e2e/serve.mjs` starts `e2e/mock-backend.mjs` (port 4546) and `vike dev` (port 3101) with test
`PUBLIC_ENV__*` / `VITE_*` values, so `import.meta.env` points at the mock.

Covered: the home page, the static pages, the rules and modpack lists rendered from the mocked
api, 404, and the `/wiki/*` -> `wiki.fasberry.fun` and `/info/*` -> `api.fasberry.fun` redirects.

Not covered: browser interactions. Chromium dies on the `vike dev` pages on a loaded machine
(unminified dev bundles), so a UI test needs a production build or CI resources; when that is
available, add `page` tests here and keep the request suite as the fast base.
