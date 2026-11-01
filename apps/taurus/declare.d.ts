import type { Rec } from "@reatom/framework";
import type { PersistRecord } from "@reatom/persist";
import type { JSXElement } from "solid-js";
import 'solid-js';
import type { operations } from "./shared/types/gen";
import type { Locale } from "./paraglide/runtime";

declare global {
  namespace Vike {
    interface Server {
      server: 'hono'
    }

    interface PageContext {
      snapshot: Rec<PersistRecord<unknown>>,
      Page: () => JSXElement,
      locale: Locale
    }
  }

  type Env = {
    Variables: {
      locale: Locale
    }
  }

  type PaginatedMeta = {
    hasNextPage: boolean,
    hasPrevPage: boolean,
    endCursor?: string,
    startCursor?: string
  }

  type WrappedResponse<T> = { data: T } | { error: string };

  type Entries<T> = { [K in keyof T]: [K, T[K]] }[keyof T][]
  type Maybe<T> = T | undefined

  type ExtractApiData<T extends keyof operations> =
    operations[T]["responses"] extends { 200: { content: { "application/json": infer Data } } }
    ? Data
    : never;
}

declare module 'solid-js' {
  namespace JSX {
    interface SvgSVGAttributes<T> {
      focusable?: boolean | string;
    }
  }
}

export { }
