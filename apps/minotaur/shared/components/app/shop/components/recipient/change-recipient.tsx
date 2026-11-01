import { reatomComponent } from "@reatom/npm-react"
import { changeRecipientIsValidAtom, changeLocalRecipient, changeLocalRecipientState } from "../../../settings/models/settings-store.model"
import { Typography } from "@/shared/ui/typography"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import { cart } from "../../models/store-cart.model"
import { Dialog } from "@ark-ui/react/dialog"
import { Portal } from "@ark-ui/react/portal"
import { dialogVariant } from "@/shared/ui/dialog"
import type React from "react"
import { translate } from "@/shared/locales/helpers"

const ChangeRecipientField = reatomComponent(({ ctx }) => {
  const oldRecipient = ctx.spy(changeLocalRecipientState.oldRecipient) ?? ""
  const newRecipient = ctx.spy(changeLocalRecipientState.newRecipient)
  const error = ctx.spy(changeLocalRecipientState.error);

  return (
    <div className="flex flex-col gap-1 w-full">
      <Input
        placeholder={translate["store.recipient.placeholder"]()}
        value={newRecipient ?? oldRecipient}
        onChange={e => changeLocalRecipientState.newRecipient(ctx, e.target.value)}
        variant={error ? "danger" : "default"}
        onClick={() => changeLocalRecipientState.error.reset(ctx)}
      />
      {error && <span className="text-red text-sm">{error}</span>}
    </div>
  )
}, "ChangeRecipientField")

const ChangeRecipientSave = reatomComponent<{ id: number }>(({ ctx, id }) => (
  <Button
    background="white"
    type="submit"
    className="w-fit self-end text-sm font-semibold"
    disabled={!ctx.spy(changeRecipientIsValidAtom) || ctx.spy(changeLocalRecipient.submit.statusesAtom).isPending}
  >
    {translate["store.recipient.apply"]()}
  </Button>
), "ChangeRecipientSave")

export const ChangeRecipientDialog = reatomComponent(({ ctx }) => {
  const id = ctx.get(changeLocalRecipientState.recipientId)!
  const title = ctx.get(changeLocalRecipientState.title)!

  const handle = (e: React.FormEvent) => {
    e.preventDefault();
    changeLocalRecipient.submit(ctx, id, cart.update)
  }

  return (
    <Dialog.Root
      open={ctx.spy(changeLocalRecipientState.isOpen)}
      onOpenChange={({ open }) => changeLocalRecipientState.isOpen(ctx, open)}
    >
      <Portal>
        <Dialog.Backdrop className={dialogVariant.backdrop()} />
        <Dialog.Positioner className={dialogVariant.positioner()}>
          <Dialog.Content className={dialogVariant.content("w-lg")}>
            <form onSubmit={handle} className="flex flex-col gap-4 w-full h-full">
              <div className="flex flex-col gap-1 w-full">
                <Typography className="font-semibold leading-tight">
                  {translate["store.recipient.title"]()} <span className="italic text-neutral-50">{title}</span>
                </Typography>
                <Typography color="gray" className="text-sm">
                  {translate["store.recipient.description"]()}
                </Typography>
              </div>
              <div className="flex items-center w-full gap-2">
                <div className="flex flex-col w-full">
                  <Typography color="gray" className="text-sm">
                    {translate["store.recipient.current"]()}
                  </Typography>
                  <ChangeRecipientField />
                </div>
              </div>
              <div className="flex gap-1 flex-col sm:flex-row w-full items-center justify-between">
                <ChangeRecipientSave id={id} />
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}, "ChangeRecipient")
