import { ALERT_DIALOG_DELAY } from "@/shared/consts/index"
import {
  type Action, type Atom, type ControlledPromise,
  action, isAction, nonNullable, reatomAsync, withStatusesAtom, atom
} from "@reatom/framework"
import { sleep, withAssign, withReset } from "@reatom/framework"
import { toast } from "sonner"
import { translate } from "@/shared/locales/helpers"

type AlertDialogConfig = {
  onConfirm?: Action | (() => ControlledPromise<any>),
  onClose?: () => void,
  onCancel?: () => void,
} & {
  confirmLabel?: string
  title?: string,
  description?: string
  dialogTitle?: string,
  autoClose?: boolean,
  errorAtom?: Atom<Error | undefined>,
  withCancel?: boolean,
  withPending?: boolean
}

export const alertDialogState = atom(null, "alertDialogState").pipe(
  withAssign((_, name) => ({
    isOpen: atom(false, `${name}.isOpen`),
    config: atom<AlertDialogConfig | null>(null, `${name}.config`).pipe(withReset())
  }))
)
export const alertDialog = atom(null, "alertDialog").pipe(
  withAssign((_, name) => ({
    open: action((ctx, config: AlertDialogConfig) => {
      if (ctx.get(alertDialog.confirm.statusesAtom).isPending) return;

      if (ctx.get(alertDialog.afterClose.statusesAtom).isPending) {
        toast.warning(translate["shared.alert-dialog.not-so-fast"]())
        return;
      }

      const configWithDefaults = {
        autoClose: true,
        withCancel: true,
        withPending: true,
        confirmLabel: translate["shared.alert-dialog.confirm"](),
        ...config,
      }

      alertDialogState.config(ctx, configWithDefaults);
      alertDialogState.isOpen(ctx, true);
    }, `${name}.open`),
    confirm: reatomAsync(async (ctx) => {
      const { onConfirm: cb, ...config } = nonNullable(ctx.get(alertDialogState.config))

      if (cb) {
        if (isAction(cb)) {
          cb(ctx)
        } else {
          if (config.withPending) {
            await cb()
          } else {
            cb();
          }
        }
      }

      if (config.autoClose) {
        alertDialog._close(ctx)
      }
    }, `${name}.confirm`).pipe(
      withStatusesAtom()
    ),
    cancel: action((ctx) => {
      if (ctx.get(alertDialog.confirm.statusesAtom).isPending) return;

      const config = nonNullable(ctx.get(alertDialogState.config))

      if (config.withCancel) {
        config.onCancel?.()
      }

      alertDialog._close(ctx)
    }, `${name}.cancel`),
    _close: action((ctx) => {
      alertDialogState.isOpen(ctx, false)
    }, `${name}.close`),
    handleOpen: action((ctx, value: boolean) => {
      if (ctx.get(alertDialog.confirm.statusesAtom).isPending) return;

      if (value) {
        console.warn("Opening is not allowed")
      } else {
        alertDialog.cancel(ctx)
      }
    }),
    afterClose: reatomAsync(async (ctx) => {
      const config = ctx.get(alertDialogState.config);

      await sleep(ALERT_DIALOG_DELAY);

      if (config) {
        config.onClose?.()
      }

      alertDialogState.config.reset(ctx)
    }, `${name}.afterClose`).pipe(
      withStatusesAtom()
    )
  }))
)

alertDialogState.isOpen.onChange((ctx, state) => !state && alertDialog.afterClose(ctx))
