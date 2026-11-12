import { dialogVariant } from "@/shared/ui/dialog";
import { IconLoader } from "@/shared/ui/icon-loader";
import { Dialog } from "@ark-ui/react/dialog";
import { Portal } from "@ark-ui/react/portal";
import { CapWidget } from "@better-captcha/react/provider/cap-widget";
import { reatomComponent } from "@reatom/npm-react";
import { getCapUrl, pof } from "../models/cap.model";
import { translate } from "@/shared/locales/helpers";

const createCapMessages = () => ({
  i18nInitialState: translate["verification.initial"](),
  i18nVerifyingLabel: translate["verification.verifying"](),
  i18nVerifyingAriaLabel: translate["verification.verifying"](),
  i18nVerifiedAriaLabel: translate["verification.verified"](),
  i18nVerifyAriaLabel: translate["verification.verify"](),
  i18nErrorAriaLabel: translate["verification.error"](),
  i18nErrorLabel: translate["verification.error"](),
  i18nWasmDisabled: translate["verification.wasm-required"](),
  i18nSolvedLabel: translate["verification.solved"](),
})

const CapWidgetWrapper = reatomComponent(({ ctx }) => {
  const data = ctx.spy(pof.data);

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-40">
        <IconLoader />
      </div>
    )
  }

  const { cb: { onSolve, onError, onReady }, withProgress } = data;

  return (
    <CapWidget
      endpoint={getCapUrl()}
      options={{
        ...createCapMessages(),
        onprogress: (e) => {
          if (withProgress && import.meta.env.DEV) {
            console.log(e.detail.progress)
          }
        },
      }}
      onSolve={(value) => onSolve?.(value)}
      onError={(e) => onError?.(e)}
      onReady={() => onReady?.()}
    />
  )
}, "CapWidgetWrapper")

/**
 * CAP is deliberately modal: it has no cancel or close control. The only exit
 * is a solved challenge or a widget error, which the auth model handles.
 */
export const Cap = reatomComponent(({ ctx }) => {
  return (
    <Dialog.Root
      open={ctx.spy(pof.isOpen)}
      closeOnEscape={false}
      closeOnInteractOutside={false}
    >
      <Portal>
        <Dialog.Backdrop className={dialogVariant.backdrop()} />
        <Dialog.Positioner className={dialogVariant.positioner()}>
          <Dialog.Content className={dialogVariant.content("bg-transparent!")}>
            <CapWidgetWrapper />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}, "Cap")
