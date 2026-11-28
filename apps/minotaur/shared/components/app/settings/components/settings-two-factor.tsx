import { useState } from "react";
import { reatomComponent, useUpdate } from "@reatom/npm-react";
import { QrCode } from "@ark-ui/react/qr-code";
import { spawn } from "@reatom/framework";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { Input } from "@/shared/ui/input";
import { Skeleton } from "@/shared/ui/skeleton";
import { Typography } from "@/shared/ui/typography";
import { qrCodeVariant } from "@/shared/ui/qr-code";
import { translate } from "@/shared/locales/helpers";
import { twoFactor, twoFactorState } from "../models/settings-two-factor.model";

const TwoFactorCodeInput = reatomComponent<{ value: string; onChange: (value: string) => void; id: string }>(({
  value, onChange, id
}) => (
  <Input
    id={id}
    value={value}
    onChange={(event) => onChange(event.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
    inputMode="numeric"
    autoComplete="one-time-code"
    placeholder="000000"
    maxLength={6}
  />
), "TwoFactorCodeInput")

const SetupStep = reatomComponent(({ ctx }) => {
  const setup = ctx.spy(twoFactorState.setup)
  const isPending = ctx.spy(twoFactor.confirm.statusesAtom).isPending
  const error = ctx.spy(twoFactor.confirm.errorAtom)
  const [code, setCode] = useState("")

  if (!setup) return null

  const submit = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (code.length !== 6) return
    spawn(ctx, (spawnCtx) => twoFactor.confirm(spawnCtx, code))
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={submit}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <QrCode.Root
          defaultValue={setup.otpauth}
          encoding={{ ecc: "M" }}
          className={qrCodeVariant.root({ className: "[--qr-code-size:160px]" })}
        >
          <QrCode.Frame className={qrCodeVariant.frame()}>
            <QrCode.Pattern className={qrCodeVariant.pattern()} />
          </QrCode.Frame>
          <QrCode.Overlay className={qrCodeVariant.overlay()}>
            <img src="/favicon.ico" alt="" draggable={false} />
          </QrCode.Overlay>
        </QrCode.Root>
        <div className="flex min-w-0 flex-col gap-2">
          <Typography className="text-sm font-medium">
            {translate["settings.security.two-factor.setup-title"]()}
          </Typography>
          <Typography color="gray" className="text-sm">
            {translate["settings.security.two-factor.setup-description"]()}
          </Typography>
          <code className="break-all rounded-lg bg-neutral-900 px-3 py-2 text-xs text-neutral-300">
            {setup.secret}
          </code>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="two-factor-code" className="text-sm font-medium text-neutral-300">
          {translate["settings.security.two-factor.code"]()}
        </label>
        <TwoFactorCodeInput id="two-factor-code" value={code} onChange={setCode} />
        {error && (
          <Typography className="text-sm text-red-300">
            {translate["settings.security.two-factor.invalid"]()}
          </Typography>
        )}
      </div>
      <div className="flex gap-2">
        <Button type="submit" background="positive" disabled={isPending || code.length !== 6} withSpinner isLoading={isPending}>
          {translate["settings.security.two-factor.confirm"]()}
        </Button>
        <Button type="button" background="default" onClick={() => spawn(ctx, (spawnCtx) => twoFactor.reset(spawnCtx))}>
          {translate["settings.security.two-factor.cancel"]()}
        </Button>
      </div>
    </form>
  )
}, "TwoFactorSetupStep")

const BackupStep = reatomComponent(({ ctx }) => {
  const codes = ctx.spy(twoFactorState.backupCodes)
  const [copied, setCopied] = useState(false)

  if (!codes) return null

  const copy = async () => {
    await navigator.clipboard.writeText(codes.join("\n"))
    setCopied(true)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Typography className="text-sm font-medium">
          {translate["settings.security.two-factor.backup-title"]()}
        </Typography>
        <Typography color="gray" className="text-sm">
          {translate["settings.security.two-factor.backup-description"]()}
        </Typography>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {codes.map((code) => (
          <code key={code} className="rounded-lg bg-neutral-900 px-2 py-1.5 text-center text-xs text-neutral-200">
            {code}
          </code>
        ))}
      </div>
      <div className="flex gap-2">
        <Button type="button" background="default" onClick={copy}>
          <Icon name={copied ? "sprite:check" : "sprite:copy"} className="size-4" />
          {copied
            ? translate["settings.security.two-factor.copied"]()
            : translate["settings.security.two-factor.copy"]()}
        </Button>
        <Button type="button" background="positive" onClick={() => spawn(ctx, (spawnCtx) => twoFactor.reset(spawnCtx))}>
          {translate["settings.security.two-factor.done"]()}
        </Button>
      </div>
    </div>
  )
}, "TwoFactorBackupStep")

const DisableForm = reatomComponent(({ ctx }) => {
  const isPending = ctx.spy(twoFactor.disable.statusesAtom).isPending
  const [password, setPassword] = useState("")
  const [code, setCode] = useState("")

  const submit = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!password || code.length !== 6) return
    spawn(ctx, (spawnCtx) => twoFactor.disable(spawnCtx, { password, code }))
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={submit}>
      <Typography className="text-sm font-medium">
        {translate["settings.security.two-factor.disable-title"]()}
      </Typography>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="two-factor-password" className="text-sm font-medium text-neutral-300">
          {translate["settings.security.two-factor.password"]()}
        </label>
        <Input
          id="two-factor-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="two-factor-disable-code" className="text-sm font-medium text-neutral-300">
          {translate["settings.security.two-factor.code"]()}
        </label>
        <TwoFactorCodeInput id="two-factor-disable-code" value={code} onChange={setCode} />
      </div>
      <Button
        type="submit"
        variant="danger"
        className="self-start"
        disabled={isPending || !password || code.length !== 6}
        withSpinner
        isLoading={isPending}
      >
        {translate["settings.security.two-factor.disable"]()}
      </Button>
    </form>
  )
}, "TwoFactorDisableForm")

export const TwoFactorSettings = reatomComponent(({ ctx }) => {
  useUpdate(twoFactor.fetchStatus, [])

  const status = ctx.spy(twoFactorState.status)
  const step = ctx.spy(twoFactorState.step)
  const isSetupPending = ctx.spy(twoFactor.startSetup.statusesAtom).isPending

  if (ctx.spy(twoFactor.fetchStatus.statusesAtom).isFirstPending || !status) {
    return <Skeleton className="h-24 w-full" />
  }

  if (step === "setup") return <SetupStep />
  if (step === "backup") return <BackupStep />

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Typography className="text-sm font-medium">
          {status.enabled
            ? translate["settings.security.two-factor.enabled"]()
            : translate["settings.security.two-factor.disabled"]()}
        </Typography>
        <Typography color="gray" className="text-sm">
          {translate["settings.security.two-factor.description"]()}
        </Typography>
        {status.enabled && (
          <Typography color="gray" className="text-xs">
            {translate["settings.security.two-factor.backup-remaining"]({ count: status.backupCodesRemaining })}
          </Typography>
        )}
      </div>
      {!status.enabled && (
        <Button
          type="button"
          background="positive"
          className="self-start"
          disabled={isSetupPending}
          withSpinner
          isLoading={isSetupPending}
          onClick={() => spawn(ctx, (spawnCtx) => twoFactor.startSetup(spawnCtx))}
        >
          {translate["settings.security.two-factor.enable"]()}
        </Button>
      )}
      {status.enabled && <DisableForm />}
    </div>
  )
}, "TwoFactorSettings")
