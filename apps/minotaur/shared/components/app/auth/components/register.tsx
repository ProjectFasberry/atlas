import { reatomComponent } from "@reatom/npm-react"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import { Icon } from "@/shared/ui/icon"
import { Checkbox } from "@ark-ui/react/checkbox"
import { spawn } from "@reatom/framework"
import { auth, authState } from "../models/auth.model"
import { register, registerState } from "../models/register.model"
import { AuthField, NicknameInput, PasswordInput, PasswordVisibility } from "./auth"
import { focusFirstAuthError } from "./focus"
import { translate } from "@/shared/locales/helpers"
import { getLocale } from "@/paraglide/runtime"
import { checkboxVariant } from "@/shared/ui/checkbox"

const FindoutInput = reatomComponent(({ ctx }) => (
  <Input
    id="register-findout"
    data-auth-field="findout"
    autoCorrect="off"
    autoCapitalize="off"
    spellCheck="false"
    autoComplete="off"
    className="w-full"
    variant={ctx.spy(authState.errorsType).includes("findout") ? "danger" : "default"}
    aria-invalid={ctx.spy(authState.errorsType).includes("findout")}
    aria-describedby={ctx.spy(authState.globalError) ? "auth-error" : undefined}
    placeholder={translate["auth.register.placeholders.findoutOther"]()}
    value={ctx.spy(authState.fields.findout) ?? ""}
    onClick={() => auth.resetError(ctx)}
    onChange={e => {
      authState.fields.findoutType(ctx, "custom")
      authState.fields.findout(ctx, e.target.value)
    }}
    maxLength={128}
  />
), "FindoutInput")

const PasswordRepeatInput = reatomComponent(({ ctx }) => {
  const errors = ctx.spy(authState.errorsType)
  const invalid = errors.includes("passwordRepeat") || errors.includes("password")
  const hasError = !!ctx.spy(authState.globalError)

  return (
    <div className="flex relative items-center justify-between w-full">
      <Input
        id="register-passwordRepeat"
        data-auth-field="passwordRepeat"
        className="w-full pr-12"
        variant={invalid ? "danger" : "default"}
        type={ctx.spy(authState.settings.showPasswordRepeat) ? "text" : "password"}
        autoComplete="new-password"
        aria-label={translate["auth.register.labels.password-repeat"]()}
        aria-invalid={invalid}
        aria-describedby={hasError ? "auth-error" : undefined}
        placeholder={translate["auth.register.placeholders.password-repeat"]()}
        value={ctx.spy(authState.fields.passwordRepeat)}
        onClick={() => auth.resetError(ctx)}
        onChange={e => authState.fields.passwordRepeat(ctx, e.target.value)}
        maxLength={72}
      />
      <PasswordVisibility visibility={authState.settings.showPasswordRepeat} />
    </div>
  )
}, "PasswordRepeatInput")

const PasswordPolicyHint = () => (
  <span className="text-xs text-neutral-400">{translate["auth.register.password-hint"]()}</span>
)

const PasswordMismatchHint = reatomComponent(({ ctx }) => {
  const password = ctx.spy(authState.fields.password)
  const repeat = ctx.spy(authState.fields.passwordRepeat)
  if (!repeat.length || password === repeat) return null

  return (
    <span className="text-xs text-red">{translate["auth.register.password-mismatch"]()}</span>
  )
}, "PasswordHint")

const PrivacyTerms = reatomComponent(({ ctx }) => {
  const invalid = ctx.spy(authState.errorsType).includes("acceptRules")

  return (
    <div className="inline-flex gap-2 items-start">
      <Checkbox.Root
        id="rules"
        checked={ctx.spy(authState.fields.acceptRules)}
        onCheckedChange={(e) => typeof e.checked === 'boolean' && authState.fields.acceptRules(ctx, e.checked)}
        className={checkboxVariant.root()}
      >
        <Checkbox.Control
          aria-invalid={invalid}
          className={checkboxVariant.control({ variant: "filled" })}
        />
        <Checkbox.HiddenInput />
      </Checkbox.Root>
      <label
        lang={getLocale()}
        className="select-none relative -top-1 text-sm [&_a]:text-green-500 [&_a]:inline [hyphens:auto]"
        htmlFor="checkbox:rules:input"
      >
        {translate["auth.register.acceptRulesTitle"]()}
        <a href="/privacy" target="_blank" rel="noreferrer">
          &nbsp;{translate["auth.register.acceptRulesPrivacy"]()}
        </a>,
        <a href="/terms" target="_blank" rel="noreferrer">
          &nbsp;{translate["auth.register.acceptRulesProcessing"]()}&nbsp;
        </a>
        {translate["auth.register.acceptRulesAnd"]()}
        <a href="/rules" target="_blank" rel="noreferrer">
          &nbsp;{translate["auth.register.acceptRulesProject"]()}
        </a>.
      </label>
    </div>
  )
}, "PrivacyTerms")

const RegisterSubmit = reatomComponent(({ ctx }) => {
  const isPending = ctx.spy(register.submit.statusesAtom).isPending
    || ctx.spy(authState.isProcessing)

  return (
    <Button
      type="submit"
      background="positive"
      className="w-full font-semibold"
      disabled={isPending}
      withSpinner
      isLoading={isPending}
    >
      {translate["auth.register.submit"]()}
    </Button>
  )
}, "RegisterSubmit")

const RegisterSuccess = reatomComponent(({ ctx }) => (
  <div className="flex flex-col gap-4 w-full items-center justify-center">
    <div className="flex flex-col gap-2 w-full items-center justify-center">
      <Icon name="sprite:check" className="size-8 text-green-400" />
      <p className="text-xl w-full leading-5 font-semibold text-center">
        {translate["auth.register.success"]()}
      </p>
    </div>
    <Button
      className="w-full font-semibold"
      background="positive"
      onClick={() => register.toLogin(ctx)}
    >
      {translate["auth.register.toLogin"]()}
    </Button>
  </div>
), "RegisterSuccess")

export const RegisterForm = reatomComponent(({ ctx }) => {
  if (ctx.spy(registerState.success)) return <RegisterSuccess />

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    void spawn(ctx, (spawnCtx) => register.submit(spawnCtx))
      .then(() => focusFirstAuthError(ctx))
  }

  return (
    <form className="flex flex-col gap-4 w-full h-full" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-3 w-full">
        <AuthField
          id="register-nickname"
          label={translate["auth.shared.labels.nickname"]()}
          hint={<span className="text-xs text-neutral-400">{translate["auth.register.nickname-hint"]()}</span>}
        >
          <NicknameInput id="register-nickname" />
        </AuthField>
        <AuthField
          id="register-password"
          label={translate["auth.shared.labels.password"]()}
          hint={<PasswordPolicyHint />}
        >
          <PasswordInput id="register-password" />
        </AuthField>
        <AuthField
          id="register-passwordRepeat"
          label={translate["auth.register.labels.password-repeat"]()}
          hint={<PasswordMismatchHint />}
        >
          <PasswordRepeatInput />
        </AuthField>
        <AuthField
          id="register-findout"
          label={translate["auth.register.labels.findout"]()}
        >
          <FindoutInput />
        </AuthField>
      </div>
      <PrivacyTerms />
      <RegisterSubmit />
    </form>
  )
}, "RegisterForm")
