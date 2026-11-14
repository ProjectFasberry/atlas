import { z } from 'zod';

/**
 * Every variable the server reads. Parsed on first use, not at import time, so a
 * production build without runtime secrets still succeeds and a broken deploy fails
 * with a readable message instead of `undefined` deep inside a query.
 */
const schema = z
  .object({
    DATABASE_URL: z.url().optional(),
    WIKI_DATABASE_URL: z.url().optional(),
    PGHOST: z.string().min(1).optional(),
    PGPORT: z.coerce.number().int().min(1).max(65_535).default(5_432),
    PGUSER: z.string().min(1).optional(),
    PGPASSWORD: z.string().optional(),
    PGDATABASE: z.string().min(1).optional(),
    WIKI_DB_POOL_MAX: z.coerce.number().int().min(1).max(100).default(8),
    WIKI_MIGRATIONS_DIR: z.string().min(1).optional(),
    /** Local stub: the editor is open to everyone. */
    WIKI_EDITOR_OPEN: z
      .enum(['0', '1'])
      .default('0')
      .transform((value) => value === '1'),
    /** Backend endpoint that answers whether the current cookie may edit. */
    WIKI_AUTH_CHECK_URL: z.url().optional(),
    /** Public Fasberry api, read for the server switcher. */
    WIKI_API_URL: z.url().default('https://api.fasberry.fun'),
  })
  .superRefine((value, ctx) => {
    if (value.DATABASE_URL || value.WIKI_DATABASE_URL) return;

    for (const key of ['PGHOST', 'PGUSER', 'PGDATABASE'] as const) {
      if (!value[key]) {
        ctx.addIssue({
          code: 'custom',
          path: [key],
          message: 'required, unless DATABASE_URL is set',
        });
      }
    }
  });

type ParsedEnv = z.infer<typeof schema>;

/** Postgres settings, either as a URI or as the standard PG* set. */
export type DatabaseConfig =
  | { connectionString: string }
  | {
      host: string;
      port: number;
      user: string;
      password?: string;
      database: string;
    };

export type ServerEnv = {
  database: DatabaseConfig;
  poolMax: number;
  /** Absolute or relative path to the drizzle folder; `null` means the default. */
  migrationsDir: string | null;
  editorOpen: boolean;
  authCheckUrl: string | null;
  apiUrl: string;
};

function resolve(parsed: ParsedEnv): ServerEnv {
  const url = parsed.DATABASE_URL ?? parsed.WIKI_DATABASE_URL;

  const database: DatabaseConfig = url
    ? { connectionString: url }
    : {
        host: parsed.PGHOST as string,
        port: parsed.PGPORT,
        user: parsed.PGUSER as string,
        password: parsed.PGPASSWORD,
        database: parsed.PGDATABASE as string,
      };

  return {
    database,
    poolMax: parsed.WIKI_DB_POOL_MAX,
    migrationsDir: parsed.WIKI_MIGRATIONS_DIR ?? null,
    editorOpen: parsed.WIKI_EDITOR_OPEN,
    authCheckUrl: parsed.WIKI_AUTH_CHECK_URL ?? null,
    apiUrl: parsed.WIKI_API_URL.replace(/\/$/, ''),
  };
}

let cached: ServerEnv | null = null;

/** Validated server environment: parsed once per process, then reused. */
export function getServerEnv(): ServerEnv {
  if (cached) return cached;

  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid environment:\n${z.prettifyError(parsed.error)}`);
  }

  cached = resolve(parsed.data);
  return cached;
}

/** For tests and scripts that need a fresh parse after touching `process.env`. */
export function resetServerEnv() {
  cached = null;
}
