import type { ReactNode } from "react"
import { reatomComponent } from "@reatom/npm-react"
import { Dialog, DialogTitle } from "@ark-ui/react/dialog"
import { Portal } from "@ark-ui/react/portal"
import { Button } from "@/shared/ui/button"
import { DialogClose, dialogVariant } from "@/shared/ui/dialog"
import { ErrorBlock } from "@/shared/ui/error-block"
import { Input } from "@/shared/ui/input"
import { Typography } from "@/shared/ui/typography"
import { usersAuth, usersAuthState } from "../../models/users.model"

type FieldProps = {
  label: string
  hint?: string
  children: ReactNode
}

const Field = ({ label, hint, children }: FieldProps) => (
  <label className="flex w-full flex-col gap-1">
    <span className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">{label}</span>
    {children}
    {hint ? <span className="text-[11px] text-neutral-500">{hint}</span> : null}
  </label>
)

const CreateUser = reatomComponent(({ ctx }) => {
  const error = ctx.spy(usersAuth.createUser.submit.errorAtom)
  const isPending = ctx.spy(usersAuth.createUser.submit.statusesAtom).isPending

  return (
    <Dialog.Root
      open={ctx.spy(usersAuthState.createUser.isOpen)}
      onOpenChange={({ open }) => usersAuthState.createUser.isOpen(ctx, open)}
    >
      <Dialog.Trigger asChild>
        <Button background="white" className="h-8 text-sm font-semibold">
          Создать
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop className={dialogVariant.backdrop()} />
        <Dialog.Positioner className={dialogVariant.positioner()}>
          <Dialog.Content className={dialogVariant.content("w-full max-w-md")}>
            <DialogTitle className={dialogVariant.title()}>Новый пользователь</DialogTitle>
            <form
              onSubmit={(event) => usersAuth.createUser.submit(ctx, event)}
              className="flex w-full flex-col gap-3"
            >
              <Field label="Никнейм" hint="От 3 до 32 символов, латиница и цифры">
                <Input
                  value={ctx.spy(usersAuthState.createUser.nickname)}
                  onChange={(event) => usersAuthState.createUser.nickname(ctx, event.target.value)}
                  placeholder="Steve"
                  minLength={3}
                  maxLength={32}
                  required
                  autoFocus
                />
              </Field>
              <Field label="Пароль" hint="Пароль для входа на сайте и в игре">
                <Input
                  type="password"
                  value={ctx.spy(usersAuthState.createUser.password)}
                  onChange={(event) => usersAuthState.createUser.password(ctx, event.target.value)}
                  placeholder="••••••••"
                  required
                />
              </Field>
              <Typography className="rounded-lg border border-neutral-800 bg-neutral-800/40 p-2 text-xs text-neutral-400">
                Аккаунт создаётся сразу во всех базах: игровой и сайтовой. Роль выдаётся
                отдельно уже в списке - после создания.
              </Typography>
              {error ? <ErrorBlock title={error.message} /> : null}
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  background="default"
                  className="h-8 text-sm font-semibold"
                  onClick={() => usersAuthState.createUser.isOpen(ctx, false)}
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  background="white"
                  className="h-8 text-sm font-semibold"
                  withSpinner
                  isLoading={isPending}
                  disabled={isPending}
                >
                  Создать
                </Button>
              </div>
            </form>
            <DialogClose />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}, "CreateUser")

const DeleteUser = reatomComponent(({ ctx }) => {
  const error = ctx.spy(usersAuth.deleteUser.submit.errorAtom)
  const isPending = ctx.spy(usersAuth.deleteUser.submit.statusesAtom).isPending
  const nickname = ctx.spy(usersAuthState.deleteUser.nickname)

  return (
    <Dialog.Root
      open={ctx.spy(usersAuthState.deleteUser.isOpen)}
      onOpenChange={({ open }) => usersAuthState.deleteUser.isOpen(ctx, open)}
    >
      <Dialog.Trigger asChild>
        <Button variant="danger" background="default" className="h-8 text-sm font-semibold">
          Удалить
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop className={dialogVariant.backdrop()} />
        <Dialog.Positioner className={dialogVariant.positioner()}>
          <Dialog.Content className={dialogVariant.content("w-full max-w-md")}>
            <DialogTitle className={dialogVariant.title()}>Удаление пользователя</DialogTitle>
            <form
              onSubmit={(event) => usersAuth.deleteUser.submit(ctx, event)}
              className="flex w-full flex-col gap-3"
            >
              <Field label="Никнейм">
                <Input
                  value={nickname}
                  onChange={(event) => usersAuthState.deleteUser.nickname(ctx, event.target.value)}
                  placeholder="Steve"
                  required
                  autoFocus={!nickname}
                />
              </Field>
              <Typography className="rounded-lg border border-red/40 bg-red/5 p-2 text-xs text-red">
                Пользователь будет удалён из всех баз: игровой и сайтовой. Действие
                необратимо.
              </Typography>
              {error ? <ErrorBlock title={error.message} /> : null}
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  background="default"
                  className="h-8 text-sm font-semibold"
                  onClick={() => usersAuthState.deleteUser.isOpen(ctx, false)}
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  background="default"
                  className="h-8 text-sm font-semibold"
                  withSpinner
                  isLoading={isPending}
                  disabled={isPending}
                >
                  Удалить
                </Button>
              </div>
            </form>
            <DialogClose />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}, "DeleteUser")

export const UsersManagement = () => {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <CreateUser />
      <DeleteUser />
    </div>
  )
}
