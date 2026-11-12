import { reatomComponent } from "@reatom/npm-react"
import {
  login, type AuthLoginVariant, authLoginVariantAtom, authSubmitIsDisabledAtom
} from "../models/login.model"
import { qrLogin, qrState, type AuthLoginQRStatus } from "../models/qr.model"
import { type ReactNode } from "react"
import { Icon } from "@/shared/ui/icon"
import { Button } from "@/shared/ui/button"
import { spawn } from "@reatom/framework"
import { Separator } from "@/shared/ui/separator"
import { AuthField, NicknameInput, PasswordInput } from "./auth"
import { authState } from "../models/auth.model"
import { focusFirstAuthError } from "./focus"
import { IconLoader } from "@/shared/ui/icon-loader"
import { translate } from "@/shared/locales/helpers"
import { QrCode } from "@ark-ui/react/qr-code"
import { qrCodeVariant } from "@/shared/ui/qr-code"
import { Link } from "@/shared/components/config/link/link"
import { pageState } from "@/shared/models/page-context.model"
import { getNextPath } from "@/shared/lib/auth-redirect"

const LoginVariants = reatomComponent(({ ctx }) => (
  <div className="grid grid-cols-2 auto-rows-auto gap-2 w-full [&>*:only-child]:col-span-2">
    {ctx.spy(authLoginVariantAtom.filterVariants(createLoginVariants())).map((variant) => (
      <Button
        key={variant.value}
        type="button"
        background="default"
        className={variant.value === "qr" ? "max-sm:hidden" : undefined}
        onClick={() => spawn(ctx, (spawnCtx) => authLoginVariantAtom.select(spawnCtx, variant.value))}
      >
        {variant.title}
      </Button>
    ))}
  </div>
), "LoginVariants")

const LoginPasswordSubmit = reatomComponent(({ ctx }) => {
  const isPending = ctx.spy(login.basic.submit.statusesAtom).isPending
    || ctx.spy(authState.isProcessing)

  return (
    <Button
      className="w-full h-10 font-semibold"
      background="positive"
      disabled={ctx.spy(authSubmitIsDisabledAtom)}
      withSpinner
      isLoading={isPending}
      type="submit"
    >
      {translate["auth.login.submit"]()}
    </Button>
  )
}, "LoginPasswordSubmit")

const LoginPassword = reatomComponent(({ ctx }) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    void spawn(ctx, (spawnCtx) => login.basic.submit(spawnCtx))
      .then(() => focusFirstAuthError(ctx))
  }

  const next = getNextPath(ctx.get(pageState.urlParsed)?.search)
  const forgotHref = next ? `/auth/forgot?next=${encodeURIComponent(next)}` : "/auth/forgot"

  return (
    <form
      className="flex flex-col gap-4 w-full h-full"
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col gap-3 w-full">
        <AuthField id="login-nickname" label={translate["auth.shared.labels.nickname"]()}>
          <NicknameInput id="login-nickname" />
        </AuthField>
        <AuthField id="login-password" label={translate["auth.shared.labels.password"]()}>
          <PasswordInput id="login-password" />
        </AuthField>
        <Link
          href={forgotHref}
          className="self-end text-sm text-neutral-400 duration-150 hover:text-neutral-50"
        >
          {translate["auth.login.forgot"]()}
        </Link>
      </div>
      <LoginPasswordSubmit />
    </form>
  )
}, 'LoginPassword')

const LoginQRRetry = reatomComponent<{ reason: "expired" | "error" }>(({ ctx, reason }) => {
  const isPending = ctx.spy(qrLogin.generate.statusesAtom).isPending

  const handleClick = () => {
    qrLogin.generate.errorAtom.reset(ctx);
    spawn(ctx, (spawnCtx) => qrLogin.generate(spawnCtx));
  };

  return (
    <div className="flex flex-col w-full items-center justify-center gap-3">
      <p className="text-sm text-neutral-400 text-center">
        {reason === "error"
          ? translate["auth.login.qr.error"]()
          : translate["auth.login.qr.expired"]()}
      </p>
      {reason === "error" && (
        <p className="text-xs text-neutral-500 text-center">
          {translate["auth.login.qr.error-description"]()}
        </p>
      )}
      <button
        type="button"
        disabled={isPending}
        onClick={handleClick}
        aria-label={translate["auth.login.qr.refresh"]()}
        className="group cursor-pointer active:scale-[0.98] duration-150 flex items-center gap-2"
      >
        <Icon name='sprite:refresh' className={`size-[32px] text-neutral-200 ${isPending ? "animate-spin" : ""}`} />
        <span className="text-sm font-semibold">{translate["auth.login.qr.refresh"]()}</span>
      </button>
    </div>
  )
}, "LoginQRRetry")

const LoginQRConnected = reatomComponent(({ ctx }) => {
  const isPending = ctx.spy(qrLogin.generate.statusesAtom).isPending
  const url = ctx.spy(qrState.url)
  if (isPending || !url) return <IconLoader />

  return (
    <QrCode.Root
      defaultValue={url}
      encoding={{ ecc: 'M' }}
      className={qrCodeVariant.root({ className: "[--qr-code-size:196px]" })}
    >
      <QrCode.Frame className={qrCodeVariant.frame()}>
        <QrCode.Pattern className={qrCodeVariant.pattern()} />
      </QrCode.Frame>
      <QrCode.Overlay className={qrCodeVariant.overlay()}>
        <img src="/favicon.ico" alt="" draggable={false} />
      </QrCode.Overlay>
    </QrCode.Root>
  )
}, "LoginQRConnected")

const LoginQRDeclined = reatomComponent(({ ctx }) => (
  <div className="flex flex-col w-full items-center justify-center gap-3">
    <Icon name="sprite:hand-stop" className="size-[32px] text-red-600" />
    <p className="text-sm text-neutral-400 text-center">
      {translate["auth.login.qr.declined"]()}
    </p>
    <Button
      type="button"
      background="default"
      onClick={() => spawn(ctx, (spawnCtx) => qrLogin.generate(spawnCtx))}
    >
      {translate["auth.login.qr.retry"]()}
    </Button>
  </div>
), "LoginQRDeclined")

const LoginQRScanned = () => (
  <div className="flex flex-col items-center gap-2">
    <LoginQRConnected />
    <p className="text-sm text-neutral-400 text-center">
      {translate["auth.login.qr.scanned"]()}
    </p>
  </div>
)

const LoginVerified = () => (
  <div className="flex flex-col w-full items-center justify-center gap-4">
    <Icon name="sprite:check" className="size-[32px] text-green-600" />
  </div>
)

const LOGIN_QR_COMPONENTS: Partial<Record<AuthLoginQRStatus, ReactNode>> = {
  "idle": <LoginQRConnected />,
  "expired": <LoginQRRetry reason="expired" />,
  "connected": <LoginQRScanned />,
  "declined": <LoginQRDeclined />,
  "verified": <LoginVerified />,
  "error": <LoginQRRetry reason="error" />
}

const LoginQRContent = reatomComponent(({ ctx }) => {
  const error = ctx.spy(qrLogin.generate.errorAtom)
  if (error) return <LoginQRRetry reason="error" />

  return LOGIN_QR_COMPONENTS[ctx.spy(qrState.status)]
}, "LoginQRContent")

const LoginQR = () => {
  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="flex items-center justify-center w-46 h-46 rounded-xl">
        <LoginQRContent />
      </div>
      <div className="flex flex-col items-start gap-2 w-fit">
        <p>{translate["auth.login.qr.steps.1"]()}</p>
        <p>{translate["auth.login.qr.steps.2"]()}</p>
        <p>{translate["auth.login.qr.steps.3"]()}</p>
      </div>
    </div>
  )
}

const createLoginVariants = (): { title: string, value: AuthLoginVariant, component: ReactNode }[] => ([
  { title: translate["auth.login.variants.basic"](), value: "password", component: <LoginPassword /> },
  { title: translate["auth.login.variants.qr"](), value: "qr", component: <LoginQR /> }
])

const LoginFormComponent = reatomComponent(({ ctx }) =>
  createLoginVariants().find(d => d.value === ctx.spy(authLoginVariantAtom))?.component, "LoginFormComponent")

export const LoginForm = reatomComponent(({ ctx }) => {
  const active = ctx.spy(authLoginVariantAtom)

  return (
    <div className="flex flex-col gap-6 w-full h-full">
      <LoginFormComponent />
      <div className={`flex flex-col w-full gap-2 items-center justify-center ${active === "password" ? "max-sm:hidden" : ""}`}>
        <div className="flex items-center w-full gap-4">
          <Separator className="flex-1" />
          <span className="shrink-0 text-sm text-neutral-50">
            {translate["auth.login.otherVariantsTitle"]()}
          </span>
          <Separator className="flex-1" />
        </div>
        <LoginVariants />
      </div>
    </div>
  )
}, "LoginForm")
