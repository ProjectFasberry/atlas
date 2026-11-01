import { useCtx, useIsomorphicEffect, useUpdate } from '@reatom/npm-react';
import { reatomContext } from '@reatom/npm-react'
import { type PropsWithChildren } from 'react'
import { usePageContext } from 'vike-react/usePageContext'
import { Footer } from '@/shared/components/app/layout/components/footer';
import { app, syncIsMobile } from '@/shared/models/app/index.model';
import { ErrorBoundaryProvider } from './error-boundary';
import { Global } from './global';
import { useCreateCtx } from '@/shared/lib/reatom/index';
import { ENVIRONMENT } from '@/shared/consts';

const Sync = () => {
  const pageCtx = usePageContext()
  return useUpdate((ctx) => app.sync(ctx, pageCtx), [pageCtx])
}

const MobileSync = () => {
  const ctx = useCtx();

  useIsomorphicEffect(() => {
    syncIsMobile(ctx);
  }, [ctx]);

  return null;
};

const AppProvider = ({ children }: PropsWithChildren) => {
  useUpdate((ctx) => app.init(ctx), []);

  return (
    <>
      <main id="page-container">
        {children}
        <Footer />
      </main>
      <Global />
    </>
  )
}

const ReatomProvider = ({ children }: PropsWithChildren) => {
  const pageCtx = usePageContext();
  const reatomCtx = useCreateCtx((ctx) => {
    if (import.meta.env.DEV && ENVIRONMENT === 'client') {
      app.initReatomLogger(ctx)
    }

    app.preInit(ctx, pageCtx.snapshot)
  })
  return <reatomContext.Provider value={reatomCtx}>{children}</reatomContext.Provider>
}

export const WrapperChild = ({ children }: PropsWithChildren) => {
  return (
    <ReatomProvider>
      <ErrorBoundaryProvider>
        <MobileSync />
        <Sync />
        <AppProvider>
          {children}
        </AppProvider>
      </ErrorBoundaryProvider>
    </ReatomProvider>
  )
}
