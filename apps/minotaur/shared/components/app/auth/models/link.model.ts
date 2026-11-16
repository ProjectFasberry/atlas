import { action, atom, reatomAsync, withAssign, withReset } from "@reatom/framework";
import { client } from "@/shared/lib/client-wrapper";
import { logError } from "@/shared/lib/log";
import { translate } from "@/shared/locales/helpers"

type LinkKind = "invite" | "referral";

type CheckPayload = {
  kind: LinkKind;
  nickname: string | null;
};

type AcceptPayload = {
  nickname: string;
};

export const linkState = atom(null, "linkState").pipe(
  withAssign((_, name) => ({
    token: atom<string | null>(null, `${name}.token`).pipe(withReset()),
    kind: atom<LinkKind | null>(null, `${name}.kind`).pipe(withReset()),
    /** Nickname reserved by an invite; referrals let the player pick one. */
    reservedNickname: atom<string | null>(null, `${name}.reservedNickname`).pipe(withReset()),
    nickname: atom("", `${name}.nickname`).pipe(withReset()),
    password: atom("", `${name}.password`).pipe(withReset()),
    passwordRepeat: atom("", `${name}.passwordRepeat`).pipe(withReset()),
    error: atom<string | null>(null, `${name}.error`).pipe(withReset()),
    checking: atom(false, `${name}.checking`).pipe(withReset()),
    pending: atom(false, `${name}.pending`).pipe(withReset()),
  })),
);

const invalidLink = () => translate["auth.link.error-invalid"]();

export const linkFlow = atom(null, "linkFlow").pipe(
  withAssign((_, name) => ({
    start: action((ctx, token: string) => {
      linkState.token(ctx, token);
      linkState.error.reset(ctx);
    }, `${name}.start`),
    check: reatomAsync(async (ctx, token: string) => {
      linkState.checking(ctx, true);

      try {
        const payload = await client.raw.get<CheckPayload>("/auth/link/check", {
          params: { query: { token } },
        });

        linkState.kind(ctx, payload.kind);
        linkState.reservedNickname(ctx, payload.nickname);
        if (payload.nickname) linkState.nickname(ctx, payload.nickname);

        return payload;
      } finally {
        linkState.checking(ctx, false);
      }
    }, {
      name: `${name}.check`,
      onReject: (ctx, error) => {
        logError(error);
        linkState.error(ctx, invalidLink());
      },
    }),
    accept: reatomAsync(async (ctx) => {
      const token = ctx.get(linkState.token);
      const kind = ctx.get(linkState.kind);
      const password = ctx.get(linkState.password);
      const nickname = ctx.get(linkState.nickname).trim();

      if (!token) throw new Error(invalidLink());
      if (password !== ctx.get(linkState.passwordRepeat)) {
        linkState.error(ctx, translate["auth.link.error-passwords"]());
        return null;
      }
      if (password.length < 4) {
        linkState.error(ctx, translate["auth.link.error-password-short"]());
        return null;
      }
      if (kind === "referral" && nickname.length < 3) {
        linkState.error(ctx, translate["auth.link.error-nickname-short"]());
        return null;
      }

      linkState.pending(ctx, true);

      try {
        const payload = await client.raw.post<AcceptPayload>("/auth/link/accept", {
          json: kind === "referral" ? { token, nickname, password } : { token, password },
        });

        return payload;
      } finally {
        linkState.pending(ctx, false);
      }
    }, {
      name: `${name}.accept`,
      onFulfill: (ctx, data) => {
        if (!data) return;

        // The API does not create a session; the player signs in with the password.
        window.location.assign("/auth?type=login");
      },
      onReject: (ctx, error) => {
        logError(error);
        linkState.error(ctx, invalidLink());
      },
    }),
  })),
);
