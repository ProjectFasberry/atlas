import { reatomComponent } from "@reatom/npm-react";
import { Button } from "@/shared/ui/button";
import { Typography } from "@/shared/ui/typography"
import { alertDialogState, alertDialog } from "./alert-dialog.model";
import { Dialog } from "@ark-ui/react/dialog";
import { Portal } from "@ark-ui/react/portal"
import { dialogVariant, dialogBaseStyle, DialogClose } from "@/shared/ui/dialog";
import { ErrorBlock } from "@/shared/ui/error-block";

const AlertContent = reatomComponent(({ ctx }) => {
  const opts = ctx.spy(alertDialogState.config);
  if (!opts) return null;

  const { title, withCancel, errorAtom, description, confirmLabel } = opts;

  const error = errorAtom ? ctx.spy(errorAtom) : null;

  const withStatus = {
    withSpinner: true, isLoading: ctx.spy(alertDialog.confirm.statusesAtom).isPending
  } as const;

  const showCancel = withCancel && !withStatus.isLoading
  const confirmLabelWithRetry = error ? `Повторить` : confirmLabel;

  return (
    <div className="w-full">
      <div className="flex flex-col items-center min-w-0 justify-center gap-4 h-full w-full">
        <div className="flex w-full flex-col min-w-0">
          {title && (
            <Typography className="text-wrap text-sm sm:text-base lg:text-lg leading-6 truncate">
              {title}
            </Typography>
          )}
          <Typography className="text-sm sm:text-base leading-6 text-neutral-400">
            {description ?? "Это действие нельзя отменить"}
          </Typography>
          {error && (
            <div className="mt-4 flex items-center justify-start w-full">
              <ErrorBlock title={error.message} />
            </div>
          )}
        </div>
        <div className="flex items-center min-w-0 justify-end gap-2 w-full h-full">
          {showCancel && (
            <Button
              background="default"
              className="text-sm"
              disabled={withStatus.isLoading}
              onClick={() => alertDialog.cancel(ctx)}
            >
              Отмена
            </Button>
          )}
          <Button
            background="white"
            className="text-sm font-semibold text-nowrap truncate min-w-0"
            onClick={() => alertDialog.confirm(ctx)}
            disabled={withStatus.isLoading}
            {...withStatus}
          >
            {confirmLabelWithRetry}
          </Button>
        </div>
      </div>
    </div>
  )
}, "AlertContent")

export const AlertDialog = reatomComponent(({ ctx }) => {
  const opts = ctx.spy(alertDialogState.config);

  return (
    <Dialog.Root open={ctx.spy(alertDialogState.isOpen)} onOpenChange={v => alertDialog.handleOpen(ctx, v.open)}>
      <Portal>
        <Dialog.Backdrop className={dialogVariant.backdrop()} style={dialogBaseStyle} />
        <Dialog.Positioner className={dialogVariant.positioner()} style={dialogBaseStyle} >
          <Dialog.Content className={dialogVariant.content("w-lg")} style={dialogBaseStyle} >
            <Dialog.Title className={dialogVariant.title()}>
              {opts?.dialogTitle ?? "Подтверждение действия"}
            </Dialog.Title>
            <AlertContent />
            <DialogClose />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}, "AlertDialog")
