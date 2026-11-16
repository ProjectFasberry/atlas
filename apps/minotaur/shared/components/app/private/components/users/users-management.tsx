import type { ReactNode } from "react"
import { reatomComponent } from "@reatom/npm-react"
import { Dialog, DialogTitle } from "@ark-ui/react/dialog"
import { Portal } from "@ark-ui/react/portal"
import { Button } from "@/shared/ui/button"
import { DialogClose, dialogVariant } from "@/shared/ui/dialog"
import { ErrorBlock } from "@/shared/ui/error-block"
import { Input } from "@/shared/ui/input"
import { Typography } from "@/shared/ui/typography"
import { toast } from "sonner"
import { usersAuth, usersAuthState } from "../../models/users.model"
import { translate } from "@/shared/locales/helpers"

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
          {translate["panel.delete"]()}</Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop className={dialogVariant.backdrop()} />
        <Dialog.Positioner className={dialogVariant.positioner()}>
          <Dialog.Content className={dialogVariant.content("w-full max-w-md")}>
            <DialogTitle className={dialogVariant.title()}>{translate["panel.user-deletion"]()}</DialogTitle>
            <form
              onSubmit={(event) => usersAuth.deleteUser.submit(ctx, event)}
              className="flex w-full flex-col gap-3"
            >
              <Field label={translate["panel.nickname"]()}>
                <Input
                  value={nickname}
                  onChange={(event) => usersAuthState.deleteUser.nickname(ctx, event.target.value)}
                  placeholder="Steve"
                  required
                  autoFocus={!nickname}
                />
              </Field>
              <Typography className="rounded-lg border border-red/40 bg-red/5 p-2 text-xs text-red">
                {translate["panel.the-user-will-be-deleted-from-every-database-gam"]()}</Typography>
              {error ? <ErrorBlock title={error.message} /> : null}
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  background="default"
                  className="h-8 text-sm font-semibold"
                  onClick={() => usersAuthState.deleteUser.isOpen(ctx, false)}
                >
                  {translate["panel.cancel"]()}</Button>
                <Button
                  type="submit"
                  variant="danger"
                  background="default"
                  className="h-8 text-sm font-semibold"
                  withSpinner
                  isLoading={isPending}
                  disabled={isPending}
                >
                  {translate["panel.delete"]()}</Button>
              </div>
            </form>
            <DialogClose />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}, "DeleteUser")

const InviteUser = reatomComponent(({ ctx }) => {
  const open = ctx.spy(usersAuthState.invite.isOpen)
  const link = ctx.spy(usersAuthState.invite.link)
  const error = ctx.spy(usersAuth.invite.errorAtom)
  const isPending = ctx.spy(usersAuth.invite.statusesAtom).isPending

  const close = () => {
    usersAuthState.invite.isOpen(ctx, false)
    usersAuthState.invite.link.reset(ctx)
    usersAuthState.invite.nickname.reset(ctx)
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={({ open: next }) => (next ? usersAuthState.invite.isOpen(ctx, true) : close())}
    >
      <Dialog.Trigger asChild>
        <Button background="positive" className="h-8 text-sm font-semibold">
          {translate["panel.invite"]()}</Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop className={dialogVariant.backdrop()} />
        <Dialog.Positioner className={dialogVariant.positioner()}>
          <Dialog.Content className={dialogVariant.content("w-full max-w-md")}>
            <DialogTitle className={dialogVariant.title()}>{translate["panel.player-invitation"]()}</DialogTitle>
            {link ? (
              <div className="flex w-full flex-col gap-3">
                <Typography className="text-xs text-neutral-400">
                  {translate["panel.the-link-lives-for-7-days-the-account-is-already"]()}</Typography>
                <Input readOnly value={link} onFocus={(event) => event.currentTarget.select()} />
                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    background="white"
                    className="h-8 text-sm font-semibold"
                    onClick={() => {
                      void navigator.clipboard.writeText(link)
                      toast.success(translate["panel.link-copied"]())
                    }}
                  >
                    {translate["panel.copy"]()}</Button>
                  <Button type="button" background="default" className="h-8 text-sm font-semibold" onClick={close}>
                    {translate["panel.done"]()}</Button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={(event) => usersAuth.invite(ctx, event)}
                className="flex w-full flex-col gap-3"
              >
                <Field label={translate["panel.nickname"]()} hint={translate["panel.the-account-is-created-right-away-the-player-set"]()}>
                  <Input
                    value={ctx.spy(usersAuthState.invite.nickname)}
                    onChange={(event) => usersAuthState.invite.nickname(ctx, event.target.value)}
                    placeholder="Steve"
                    minLength={3}
                    maxLength={16}
                    required
                    autoFocus
                  />
                </Field>
                {error ? <ErrorBlock title={error.message} /> : null}
                <div className="flex items-center justify-end gap-2">
                  <Button type="button" background="default" className="h-8 text-sm font-semibold" onClick={close}>
                    {translate["panel.cancel"]()}</Button>
                  <Button
                    type="submit"
                    background="white"
                    className="h-8 text-sm font-semibold"
                    withSpinner
                    isLoading={isPending}
                    disabled={isPending}
                  >
                    {translate["panel.create-a-link"]()}</Button>
                </div>
              </form>
            )}
            <DialogClose />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}, "InviteUser")

export const UsersManagement = () => {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <InviteUser />
      <DeleteUser />
    </div>
  )
}
