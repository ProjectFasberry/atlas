import { reatomComponent, useUpdate } from "@reatom/npm-react";
import { Button } from "@/shared/ui/button";
import { ErrorBlock } from "@/shared/ui/error-block";
import { Input } from "@/shared/ui/input";
import { linkFlow, linkState } from "../models/link.model";
import { translate } from "@/shared/locales/helpers"

export const LinkAccept = reatomComponent<{ token: string }>(({ ctx, token }) => {
  useUpdate((ctx) => {
    linkFlow.start(ctx, token);
    linkFlow.check(ctx, token);
  }, [token]);

  const kind = ctx.spy(linkState.kind);
  const reserved = ctx.spy(linkState.reservedNickname);
  const checking = ctx.spy(linkState.checking);
  const pending = ctx.spy(linkState.pending);
  const error = ctx.spy(linkState.error);

  if (checking) {
    return (
      <div className="flex w-full max-w-lg flex-col
        gap-2 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6">
        <span className="text-sm text-neutral-400">
          {translate["auth.link.checking"]()}
        </span>
      </div>
    );
  }

  if (!kind) {
    return (
      <div className="flex w-full max-w-lg flex-col
        gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6">
        <h2 className="text-lg font-semibold">
          {translate["auth.link.invalid-title"]()}
        </h2>
        <p className="text-sm text-neutral-400">
          {translate["auth.link.invalid-text"]()}
        </p>
        <ErrorBlock title={error ?? translate["auth.link.invalid-title"]()} raw />
      </div>
    );
  }

  return (
    <form
      className="flex w-full max-w-lg flex-col
      gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6"
      onSubmit={(event) => {
        event.preventDefault();
        linkFlow.accept(ctx);
      }}
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">
          {kind === "invite"
            ? translate["auth.link.complete-registration"]()
            : translate["auth.link.invite-registration"]()}
        </h2>
        <p className="text-sm text-neutral-400">
          {kind === "invite"
            ? translate["auth.link.reserved-nickname"]()
            : translate["auth.link.new-nickname"]()}
        </p>
      </div>
      <label className="flex flex-col gap-1.5">
        <span
          className="text-sm font-medium text-neutral-300"
        >
          {translate["auth.link.nickname"]()}
        </span>
        <Input
          value={ctx.spy(linkState.nickname)}
          onChange={(event) => linkState.nickname(ctx, event.target.value)}
          disabled={kind === "invite"}
          autoComplete="username"
          maxLength={16}
          placeholder={reserved ?? "Steve"}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-neutral-300">
          {translate["auth.link.password"]()}
        </span>
        <Input
          type="password"
          value={ctx.spy(linkState.password)}
          onChange={(event) => linkState.password(ctx, event.target.value)}
          autoComplete="new-password"
          maxLength={32}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-neutral-300">
          {translate["auth.link.password-repeat"]()}
        </span>
        <Input
          type="password"
          value={ctx.spy(linkState.passwordRepeat)}
          onChange={(event) => linkState.passwordRepeat(ctx, event.target.value)}
          autoComplete="new-password"
          maxLength={32}
        />
      </label>
      {error && <ErrorBlock title={error} raw />}
      <Button
        type="submit"
        background="white"
        className="h-10 font-semibold"
        withSpinner
        isLoading={pending}
        disabled={pending}
      >
        {translate["auth.link.submit"]()}
      </Button>
    </form>
  );
}, "LinkAccept");
