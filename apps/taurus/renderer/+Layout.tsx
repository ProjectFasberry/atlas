import '@bprogress/core/css';
import "@/shared/styles/tailwind.css";
import "@/shared/styles/minecraft.css"

import { Toaster } from "@/shared/components/toaster";
import { usePageContext } from "vike-solid/usePageContext";
import { pageState } from '@/shared/models/page.model';
import { Footer } from '@/shared/components/footer';
import { Header } from '@/shared/components/header/header';
import { createEffect, type JSXElement } from 'solid-js';
import { useCtx } from '@reatom/npm-solid-js';
import { snapshotAtom } from '@/shared/models/ssr'
import { action, connectLogger, createCtx, type Ctx } from '@reatom/framework'
import { reatomContext } from '@reatom/npm-solid-js'
import type { PageContext } from 'vike/types';

interface Fn<Args extends any[] = any[], Return = any> {
  (...a: Args): Return
}

const useCreateCtx = (extension?: Fn<[Ctx]>) => {
  const ctx = createCtx({ restrictMultipleContexts: false });
  extension?.(ctx);
  return ctx;
};

const ReatomProvider = (props: { children: JSXElement }) => {
  const snapshot = usePageContext().snapshot;

  const ctx = useCreateCtx((ctx) => {
    snapshotAtom(ctx, snapshot);

    if (typeof window !== 'undefined' && import.meta.env.DEV) {
      connectLogger(ctx);
    }
  });

  return <reatomContext.Provider value={ctx}>{props.children}</reatomContext.Provider>
}

const syncPageState = action((ctx, pageCtx: PageContext) => {
  pageState.urlParsed(ctx, pageCtx.urlParsed)
  pageState.isClient(ctx, !!pageCtx.Page)
}, "syncPageState")

const SyncPageCtx = () => {
  const ctx = useCtx();
  const pageCtx = usePageContext();

  createEffect(() => {
    syncPageState(ctx, pageCtx)
  }, [pageCtx]);

  return null;
}

const LayoutContent = (props: { children: JSXElement }) => {
  return (
    <main>
      <Toaster />
      <Header />
      <SyncPageCtx />
      <div id="page-content">
        {props.children}
      </div>
      <Footer />
    </main>
  )
}

export default function LayoutDefault(props: { children: JSXElement }) {
  return (
    <div id="page-container">
      <ReatomProvider>
        <LayoutContent>
          {props.children}
        </LayoutContent>
      </ReatomProvider>
    </div>
  );
}
