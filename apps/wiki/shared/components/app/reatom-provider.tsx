'use client';

import { reatomContext, useCreateCtx } from '@reatom/npm-react';
import type { ReactNode } from 'react';

/**
 * Creates one Reatom context per request/render. It holds no feature data: each
 * feature has a `*Sync` component that writes its atoms from server props before
 * the rest of the tree renders, so SSR markup and the first client render agree.
 */
export function ReatomProvider({ children }: { children: ReactNode }) {
  const ctx = useCreateCtx();

  return <reatomContext.Provider value={ctx}>{children}</reatomContext.Provider>;
}
