'use client';

import { reatomContext, useCreateCtx } from '@reatom/npm-react';
import type { ReactNode } from 'react';

export function ReatomProvider({ children }: { children: ReactNode }) {
  const ctx = useCreateCtx();

  return <reatomContext.Provider value={ctx}>{children}</reatomContext.Provider>;
}
