import { dialogVariant } from "@/shared/ui/dialog";
import { Noop } from "@/shared/ui/noop";
import { Typography } from "@/shared/ui/typography";
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

const CAP_OPTIONS = createCapMessages()

const CapWidgetError = ({ callback }: { callback: () => void }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <Noop title="ничего нет" />
      <Typography color="gray" className="text-sm font-semibold">
        {translate["shared.error"]()}
      </Typography>
      {import.meta.env.DEV && (
        <button onClick={callback}>
          {translate["shared.retry"]()}
        </button>
      )}
    </div>
  )
}

const CapWidgetWrapper = reatomComponent(({ ctx }) => {
  const data = ctx.spy(pof.data);

  if (!data) {
    return (
      <CapWidgetError callback={() => { }} />
    )
  }

  const { cb: { onSolve, onError, onReady }, withProgress } = data;

  return (
    <CapWidget
      endpoint={getCapUrl()}
      options={{
        ...CAP_OPTIONS,
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

export const Cap = reatomComponent(({ ctx }) => {
  return (
    <Dialog.Root open={ctx.spy(pof.isOpen)}>
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
