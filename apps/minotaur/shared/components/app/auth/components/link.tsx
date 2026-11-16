import { reatomComponent, useUpdate } from "@reatom/npm-react";
import { Button } from "@/shared/ui/button";
import { ErrorBlock } from "@/shared/ui/error-block";
import { Input } from "@/shared/ui/input";
import { linkFlow, linkState } from "../models/link.model";

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
      <div className="flex w-full max-w-lg flex-col gap-2 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6">
        <span className="text-sm text-neutral-400">Проверяем ссылку...</span>
      </div>
    );
  }

  if (!kind) {
    return (
      <div className="flex w-full max-w-lg flex-col gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6">
        <h2 className="text-lg font-semibold">Ссылка недействительна</h2>
        <p className="text-sm text-neutral-400">
          Срок действия ссылки истёк или её уже использовали. Попроси новую.
        </p>
        <ErrorBlock title={error ?? "Ссылка недействительна"} raw />
      </div>
    );
  }

  return (
    <form
      className="flex w-full max-w-lg flex-col gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6"
      onSubmit={(event) => {
        event.preventDefault();
        linkFlow.accept(ctx);
      }}
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">
          {kind === "invite" ? "Завершение регистрации" : "Регистрация по приглашению"}
        </h2>
        <p className="text-sm text-neutral-400">
          {kind === "invite"
            ? "Ник уже закреплён за тобой, осталось задать пароль."
            : "Придумай ник и пароль, чтобы присоединиться к проекту."}
        </p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-neutral-300">Никнейм</span>
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
        <span className="text-sm font-medium text-neutral-300">Пароль</span>
        <Input
          type="password"
          value={ctx.spy(linkState.password)}
          onChange={(event) => linkState.password(ctx, event.target.value)}
          autoComplete="new-password"
          maxLength={32}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-neutral-300">Повторите пароль</span>
        <Input
          type="password"
          value={ctx.spy(linkState.passwordRepeat)}
          onChange={(event) => linkState.passwordRepeat(ctx, event.target.value)}
          autoComplete="new-password"
          maxLength={32}
        />
      </label>

      {error ? <ErrorBlock title={error} raw /> : null}

      <Button
        type="submit"
        background="white"
        className="h-10 font-semibold"
        withSpinner
        isLoading={pending}
        disabled={pending}
      >
        Создать пароль
      </Button>
    </form>
  );
}, "LinkAccept");
