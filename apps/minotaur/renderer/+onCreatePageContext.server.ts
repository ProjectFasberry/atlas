import type { PageContextServer } from 'vike/types';
import { createCtx } from '@reatom/framework';
import { currentUser, currentUserState, getMe } from "@/shared/models/current-user/index.model";
import { logRouting } from '@/shared/lib/log';
import { isBotRequest } from "@/shared/lib/helpers";
import { redirect } from 'vike/abort';
import { appState, type AppDictionaries, type AppOptionsPayload } from '@/shared/models/app/index.model';
import { setupUrlAtomSettings } from '@reatom/url';
import { snapshotAtom } from "@/shared/models/ssr";
import { client } from '@/shared/lib/client-wrapper';
import { currenciesAtom, fetchCurrencies, fetchSocials, initCookie, socialsAtom } from '@/shared/models/shared.model';
import { pageState } from '@/shared/models/page-context.model';
import { getIsMobile } from "@/shared/lib/helpers";

async function fetchAppState(init: RequestInit) {
  return client<AppOptionsPayload>("app/options", init).exec();
}
async function fetchAppDictionaries(init: RequestInit) {
  return client<AppDictionaries>("app/dictionaries", init).exec();
}

function fetchSharedData(ctx: ReturnType<typeof createCtx>) {
  Promise.all([
    fetchCurrencies().then(r => currenciesAtom(ctx, r)),
    fetchSocials().then(r => socialsAtom(ctx, r))
  ]).catch(e => {
    console.error("SHARED_DATA", e)
  })
}

export async function onCreatePageContext(pageCtx: PageContextServer) {
  if (import.meta.env.DEV) {
    const url = new URL(pageCtx.urlOriginal);

    if (url.hostname === "localhost") {
      url.hostname = "127.0.0.1";
      url.port = "3006";
      throw redirect(url.toString());
    }
  }

  const { headers, urlPathname } = pageCtx;
  if (!headers) return;

  logRouting(urlPathname, "onCreatePageContext");

  const ctx = createCtx();

  function updateSnapshot() {
    pageCtx.snapshot = ctx.get(snapshotAtom)
  };

  function setupApp(opts: AppOptionsPayload, headers: Record<string, string>, dict: Nullable<AppDictionaries>) {
    appState.current.isMobile(ctx, getIsMobile(headers["user-agent"]))
    appState.dict(ctx, dict);
    appState.options(ctx, opts);

    pageState.urlParsed(ctx, pageCtx.urlParsed);
    pageState.urlPathname(ctx, pageCtx.urlPathname);
    pageState.routeParams(ctx, pageCtx.routeParams);

    initCookie(ctx, headers);
  };

  if (isBotRequest(headers, urlPathname)) {
    return updateSnapshot();
  }

  const url = new URL(urlPathname, `http://${headers["host"]}`);
  setupUrlAtomSettings(ctx, () => url)

  fetchSharedData(ctx);

  const [options, dictionaries] = await Promise.all([
    fetchAppState({ headers }),
    fetchAppDictionaries({ headers })
  ]).catch(e => {
    console.error("REQUIRED_DATA", e)
    throw redirect("/not-available")
  })

  setupApp(options, headers, dictionaries)

  if (!options.flags.isAuthed) {
    return updateSnapshot();
  }

  await getMe({ headers })
    .then(r => {
      currentUserState(ctx, r);
    })
    .catch(e => {
      console.error("CURRENT_USER", e)
      return currentUser.defineCurrentUserError(ctx, pageCtx, e)
    })

  updateSnapshot();
};
