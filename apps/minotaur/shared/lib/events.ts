import {
  type Action, type Atom, type AtomMut, type Ctx,
  atom, onConnect, onDisconnect, withReset
} from "@reatom/framework";
import { LOGGING } from "../models/devtools/debug";
import { logger } from "./logger";

type WithReset<T> = AtomMut<T | null> & {
  reset: Action<[], T | null>;
}

type Page = {
  unsubscribe: () => void
}

type PageHandler<Args extends unknown[] = []> = (
  ctx: Ctx,
  atom: WithReset<Page>,
  ...args: Args
) => Promise<void> | void;

type PageBaseHooks = {
  onConnect?: PageHandler<[isConnected: () => boolean]>;
  onDisconnect?: PageHandler;
  onAfterDisconnect?: PageHandler;
};

type PageModelConfig<TSpy = unknown> = {
  name: string
} & (
    | {
      spyedAtom: Atom<TSpy>; hooks?: PageBaseHooks & { onSpy: PageHandler<[payload: TSpy]> }
    }
    | {
      spyedAtom?: never; hooks?: PageBaseHooks & { onSpy?: never }
    }
  )

const pageLogger = logger.withTag("Page");

export const createPageModel = <TSpy = unknown>({
  name, hooks, spyedAtom
}: PageModelConfig<TSpy>) => {
  const dataAtom = atom<Nullable<Page>>(null, `${name}.page`).pipe(withReset());

  onConnect(dataAtom, (ctx) => {
    if (LOGGING.page) {
      pageLogger.info(`${name}.page connected`)
    }

    return hooks?.onConnect?.(ctx, dataAtom, ctx.isConnected)
  });

  onDisconnect(dataAtom, (ctx) => {
    if (LOGGING.page) {
      pageLogger.info(`${name}.page disconnected`)
    }

    const pageData = ctx.get(dataAtom);

    hooks?.onDisconnect?.(ctx, dataAtom);

    pageData?.unsubscribe?.()
    dataAtom.reset(ctx)

    hooks?.onAfterDisconnect?.(ctx, dataAtom)
  })

  if (spyedAtom && hooks?.onSpy) {
    spyedAtom.onChange((ctx, payload) => hooks.onSpy(ctx, dataAtom, payload))
  }

  return { dataAtom }
}

export const listenBackOnce = (cb: () => void) => {
  window.history.pushState({ active: true }, '');

  const handler = () => {
    cb();
    window.removeEventListener('popstate', handler);
  };

  window.addEventListener('popstate', handler);

  return () => {
    window.removeEventListener('popstate', handler);
  };
};
