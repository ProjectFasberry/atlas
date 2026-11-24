import { useCtx, useIsomorphicEffect, useUpdate } from '@reatom/npm-react';
import { setupUrlAtomBrowserSettings } from '@reatom/url';
import { reatomComponent } from '@reatom/npm-react';
import { reatomContext } from '@reatom/npm-react'
import { Fragment, type PropsWithChildren } from 'react'
import { usePageContext } from 'vike-react/usePageContext'
import { Footer } from '@/shared/components/app/layout/components/footer';
import { app, syncIsMobile } from '@/shared/models/app/index.model';
import { ErrorBoundaryProvider } from './error-boundary';
import { Global } from './global';
import { AppearanceSync } from './appearance-sync';
import { useCreateCtx } from '@/shared/lib/reatom/index';
import { ENVIRONMENT } from '@/shared/consts';
import { localeState } from '@/shared/models/shared.model';
import { setLocale } from '@/paraglide/runtime';
import type { AtomState } from '@reatom/framework';

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

  // @reatom/url hooks link clicks and pushes history itself by default, which
  // duplicates every Vike navigation. Vike owns routing; keep the defaults off.
  useUpdate((ctx) => {
    if (ENVIRONMENT === "client") setupUrlAtomBrowserSettings(ctx, false)
  }, []);

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

    // The server already resolved the locale (cookie/Accept-Language); reuse it
    // instead of recomputing from navigator on hydration. Persisting it to the
    // cookie also keeps later getLocale() calls in sync without freezing them.
    const pageLocale = pageCtx.locale as AtomState<typeof localeState.current> | undefined
    if (pageLocale) {
      localeState.current(ctx, pageLocale)
      if (ENVIRONMENT === 'client') void setLocale(pageLocale, { reload: false })
    }

    app.preInit(ctx, pageCtx.snapshot)
  })
  return <reatomContext.Provider value={reatomCtx}>{children}</reatomContext.Provider>
}

/** Remounts translated content after a locale switch; atom state survives. */
export const LocaleBoundary = reatomComponent<PropsWithChildren>(({ ctx, children }) => {
  const locale = ctx.spy(localeState.current)

  return <Fragment key={locale}>{children}</Fragment>
}, "LocaleBoundary")

export const WrapperChild = ({ children }: PropsWithChildren) => {
  return (
    <ReatomProvider>
      <ErrorBoundaryProvider>
        <MobileSync />
        <AppearanceSync />
        <Sync />
        <AppProvider>
          {children}
        </AppProvider>
      </ErrorBoundaryProvider>
    </ReatomProvider>
  )
}
