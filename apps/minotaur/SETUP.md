## Run

```bash
bun run dev
```

## Build

Public `VITE_*` values are read from `apps/minotaur/.env` (see `env.d.ts` for the
full list). CI resolves them in `.github/workflows/build-minotaur.yml` from
repository variables with the prod values as defaults; Infisical is retired.
