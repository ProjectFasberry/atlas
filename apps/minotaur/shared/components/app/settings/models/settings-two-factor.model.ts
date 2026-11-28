import { atom, reatomAsync, withAssign, withErrorAtom, withReset, withStatusesAtom } from "@reatom/framework";
import { client } from "@/shared/lib/client-wrapper";
import { logError } from "@/shared/lib/log";

type TwoFactorStatus = ExtractApiData<"getAuth2faStatus">["data"]
type SetupPayload = ExtractApiData<"postAuth2faSetup">["data"]
type ConfirmPayload = ExtractApiData<"postAuth2faConfirm">["data"]

export type TwoFactorStatusPayload = TwoFactorStatus

export const twoFactorState = atom(null, "twoFactorState").pipe(
  withAssign((_, name) => ({
    status: atom<TwoFactorStatus | null>(null, `${name}.status`),
    setup: atom<SetupPayload | null>(null, `${name}.setup`),
    backupCodes: atom<string[] | null>(null, `${name}.backupCodes`),
    step: atom<"idle" | "setup" | "backup">("idle", `${name}.step`),
    isConfirmed: atom(false, `${name}.isConfirmed`).pipe(withReset()),
  }))
)

export const twoFactor = atom(null, "twoFactor").pipe(
  withAssign((_, name) => ({
    fetchStatus: reatomAsync(async (ctx) => {
      return await ctx.schedule(() => client.get("/auth/2fa/status"));
    }, {
      name: `${name}.fetchStatus`,
      onFulfill: (ctx, res) => {
        twoFactorState.status(ctx, res);
      }
    }).pipe(withStatusesAtom(), withErrorAtom()),

    startSetup: reatomAsync(async (ctx, password: string) => {
      return await ctx.schedule(() =>
        client.raw.post<SetupPayload>("/auth/2fa/setup", { json: { password } })
      );
    }, {
      name: `${name}.startSetup`,
      onFulfill: (ctx, res) => {
        twoFactorState.setup(ctx, res);
        twoFactorState.step(ctx, "setup");
      },
      onReject: (ctx, error) => logError(error)
    }).pipe(withStatusesAtom(), withErrorAtom()),

    confirm: reatomAsync(async (ctx, code: string) => {
      return await ctx.schedule(() =>
        client.post("/auth/2fa/confirm", { json: { code } })
      );
    }, {
      name: `${name}.confirm`,
      onFulfill: (ctx, res: ConfirmPayload) => {
        twoFactorState.backupCodes(ctx, res.backupCodes);
        twoFactorState.setup(ctx, null);
        twoFactorState.step(ctx, "backup");
        twoFactor.fetchStatus(ctx);
      },
      onReject: (ctx, error) => logError(error)
    }).pipe(withStatusesAtom(), withErrorAtom()),

    disable: reatomAsync(async (ctx, { password, code }: { password: string; code: string }) => {
      return await ctx.schedule(() =>
        client.post("/auth/2fa/disable", { json: { password, code } })
      );
    }, {
      name: `${name}.disable`,
      onFulfill: (ctx) => {
        twoFactorState.step(ctx, "idle");
        twoFactorState.setup(ctx, null);
        twoFactorState.backupCodes(ctx, null);
        twoFactor.fetchStatus(ctx);
      },
      onReject: (ctx, error) => logError(error)
    }).pipe(withStatusesAtom(), withErrorAtom()),

    reset: reatomAsync(async (ctx) => {
      twoFactorState.step(ctx, "idle");
      twoFactorState.setup(ctx, null);
      twoFactorState.backupCodes(ctx, null);
      twoFactor.fetchStatus(ctx);
    }, `${name}.reset`).pipe(withStatusesAtom(), withErrorAtom()),
  }))
)
