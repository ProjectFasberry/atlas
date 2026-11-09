import { isEmptyArray, isError } from "@/shared/lib/utils";
import { client } from "@/shared/lib/client-wrapper";
import { atom, reatomAsync, withAssign, withCache, withErrorAtom, withReset, withStatusesAtom } from "@reatom/framework";
import { action } from "@reatom/framework";
import { alertDialog } from "@/shared/components/config/alert-dialog/alert-dialog.model";
import { toast } from "sonner";
import { translate } from "@/shared/locales/helpers";

type CurrentSession = ExtractApiData<"getAuthSessionCurrent">["data"]
type SessionRow = ExtractApiData<"getAuthSessionList">["data"][number]

export type SessionPayload = CurrentSession
export type SesssionsPayload = SessionRow[];

export const sessionsState = atom(null, "sessionsState").pipe(
  withAssign((_, name) => ({
    activeList: atom<SesssionsPayload | null>(null, `${name}.activeList`),
    current: atom<SessionPayload | null>(null, `${name}.current`),
    isConfirmed: atom<boolean>(false, `${name}.isConfirmed`).pipe(withReset())
  }))
)

export const sessions = atom(null, "sessions").pipe(
  withAssign((_, name) => ({
    init: action((ctx) => {
      sessions.fetchCurrent(ctx)
    }, `${name}.init`),
    fetchCurrent: reatomAsync(async (ctx) => {
      return await ctx.schedule(() =>
        client.get("/auth/session/current")
      );
    }, {
      name: `${name}.fetchCurrent`,
      onFulfill: (ctx, res) => {
        sessionsState.current(ctx, res);
        sessions.fetchActive(ctx)
      }
    }).pipe(
      withStatusesAtom(),
      withCache({ swr: false }),
      withErrorAtom()
    ),
    fetchActive: reatomAsync(async (ctx) => {
      const result = await ctx.schedule(() =>
        client.get("/auth/session/list", { signal: ctx.controller.signal })
      );

      return result
    }, {
      name: `${name}.fetchActive`,
      onFulfill: (ctx, res) => {
        sessionsState.activeList(ctx, () => {
          if (isEmptyArray(res)) return null;

          const curr = ctx.get(sessionsState.current);
          if (!curr) return res;

          return res.filter(d => d.id ? d.id !== curr.id : d.created_at !== curr.created_at)
        })
      }
    }).pipe(
      withStatusesAtom(),
      withCache({ swr: false }),
      withErrorAtom()
    ),
    refetchAll: action((ctx) => {
      sessions.fetchActive.cacheAtom.reset(ctx);
      sessions.fetchCurrent.cacheAtom.reset(ctx);

      sessions.fetchCurrent(ctx)
    }),
    terminateById: reatomAsync(async (ctx, id: string) => {
      if (!id) throw new Error("SESSION_ID_MISSING");

      return await client
        .delete("/auth/session/{id}", { params: { path: { id } } })
    }, {
      name: `${name}.terminateById`,
      onFulfill: (ctx) => {
        sessions.refetchAll(ctx)
      },
      onReject: (ctx, e) => {
        if (!isError(e)) return;

        if (e.message === 'INSUFFICIENT_PERMISSION_BY_TIME') {
          alertDialog.open(ctx, {
            dialogTitle: translate["settings.errors.title"](),
            description: translate["settings.sessions.forbidden"](),
            confirmLabel: translate["settings.sessions.ok"](),
            withCancel: false
          })

          return;
        }

        toast.error(translate["settings.errors.title"]())
      }
    }).pipe(
      withStatusesAtom(),
      withErrorAtom()
    ),
    terminateAll: reatomAsync(async (ctx) => {
      const isConfirmed = ctx.get(sessionsState.isConfirmed)

      if (!isConfirmed) {
        alertDialog.open(ctx, {
          title: translate["settings.sessions.end-all-confirm"](),
          onConfirm: () => {
            sessionsState.isConfirmed(ctx, true)
            return sessions.terminateAll(ctx)
          },
          onCancel: () => {
            sessionsState.isConfirmed(ctx, false)
          },
          withPending: false
        })

        return;
      }

      return await client
        .delete(`/auth/session/all`)
    }, {
      name: `${name}.terminateAll`,
      onFulfill: (ctx, res) => {
        sessions.refetchAll(ctx)
        sessionsState.isConfirmed.reset(ctx)
      },
      onReject: (ctx, e) => {
        if (!isError(e)) return;

        if (e.message === 'INSUFFICIENT_PERMISSION_BY_TIME') {
          alertDialog.open(ctx, {
            dialogTitle: translate["settings.errors.title"](),
            description: translate["settings.sessions.forbidden-rest"](),
            confirmLabel: translate["settings.sessions.ok"](),
            withCancel: false
          })

          return;
        }

        toast.error(translate["settings.errors.title"]())
      }
    }).pipe(
      withStatusesAtom(),
      withErrorAtom()
    )
  }))
)
