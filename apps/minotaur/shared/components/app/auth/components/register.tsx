import { AuthField, NicknameInput, PasswordInput, PasswordVisibility } from "./auth"
import { reatomComponent } from "@reatom/npm-react"
import { auth, type AuthFindoutType, authState } from "../models/auth.model"
import { Input } from "@/shared/ui/input"
import { type JSX, type ReactNode } from "react"
import { Button } from "@/shared/ui/button"
import { Icon } from "@/shared/ui/icon"
import {
  type AuthRegisterType,
  registerNavigationModel, register, registerState, findoutSelectedTypeAtom,
  createFindoutOptions
} from "../models/register.model"
import { focusFirstAuthError } from "./focus"
import { IconLoader } from "@/shared/ui/icon-loader"
import { spawn } from "@reatom/framework"
import { translate } from "@/shared/locales/helpers"
import { Select, createListCollection } from '@ark-ui/react/select'
import { Portal } from "@ark-ui/react/portal"
import { selectVariant, selectContentBaseStyle } from "@/shared/ui/select"
import { Typography } from "@/shared/ui/typography"
import { getLocale } from "@/paraglide/runtime"
import { Checkbox } from "@ark-ui/react/checkbox"
import { checkboxVariant } from "@/shared/ui/checkbox"

const FindoutReferrerInput = reatomComponent(({ ctx }) => (
  <Input
    autoCorrect="off"
    autoCapitalize="off"
    spellCheck="false"
    autoComplete="off"
    data-auth-field="findout"
    aria-label={translate["auth.register.labels.findout"]()}
    placeholder={translate["auth.shared.placeholders.nickname"]()}
    variant={ctx.spy(authState.errorsType).includes("findout") ? "danger" : "default"}
    aria-invalid={ctx.spy(authState.errorsType).includes("findout")}
    aria-describedby={ctx.spy(authState.globalError) ? "auth-error" : undefined}
    className="w-full"
    value={ctx.spy(authState.fields.findout) ?? ""}
    onClick={() => auth.resetError(ctx)}
    onChange={e => authState.fields.findout(ctx, e.target.value)}
    maxLength={16}
  />
), "FindoutReferrerInput")
const FindoutOtherInput = reatomComponent(({ ctx }) => (
  <Input
    autoCorrect="off"
    autoCapitalize="off"
    spellCheck="false"
    autoComplete="off"
    data-auth-field="findout"
    aria-label={translate["auth.register.labels.findout"]()}
    placeholder={translate["auth.register.placeholders.findoutOther"]()}
    className="w-full"
    variant={ctx.spy(authState.errorsType).includes("findout") ? "danger" : "default"}
    aria-invalid={ctx.spy(authState.errorsType).includes("findout")}
    aria-describedby={ctx.spy(authState.globalError) ? "auth-error" : undefined}
    value={ctx.spy(authState.fields.findout) ?? ""}
    onClick={() => auth.resetError(ctx)}
    onChange={e => authState.fields.findout(ctx, e.target.value)}
    maxLength={128}
  />
), "FindoutOtherInput")

const FINDOUT_COMPONENTS: Record<AuthFindoutType, ReactNode> = {
  "referrer": <FindoutReferrerInput />,
  "custom": <FindoutOtherInput />
}

const FindoutOptions = reatomComponent(({ ctx }) => {
  const currentItem = ctx.spy(findoutSelectedTypeAtom)
  const collection = createListCollection({
    items: createFindoutOptions()
  })

  return (
    <Select.Root
      collection={collection}
      value={currentItem ? [currentItem.value] : []}
      onValueChange={({ value }) => {
        const next = value[0] as AuthFindoutType | undefined
        if (!next) {
          authState.fields.findoutType(ctx, null)
          return
        }
        if (next !== currentItem?.value) authState.fields.findout.reset(ctx)
        authState.fields.findoutType(ctx, next)
      }}
      className="flex flex-col gap-1 w-full"
    >
      <Select.Control className={selectVariant.control()}>
        <Select.Trigger
          id="register-findout"
          data-auth-field="findout"
          aria-labelledby="findout-label"
          className={selectVariant.trigger()}
        >
          <Select.ValueText>
            {currentItem?.title ?? translate["auth.register.placeholders.findout"]()}
          </Select.ValueText>
        </Select.Trigger>
        <div className={selectVariant.indicators()}>
          <Select.ClearTrigger className={selectVariant.clearTrigger()}>
            <Icon name="sprite:x" className="size-5" />
          </Select.ClearTrigger>
          <Select.Indicator className={selectVariant.indicator()}>
            <Icon name="sprite:selector" className="size-5" />
          </Select.Indicator>
        </div>
      </Select.Control>
      <Portal>
        <Select.Positioner>
          <Select.Content className={selectVariant.content()} style={selectContentBaseStyle}>
            <Select.ItemGroup className={selectVariant.itemGroup()}>
              {createFindoutOptions().map((item) => (
                <Select.Item key={item.value} item={item} className={selectVariant.item()}>
                  <Select.ItemText className={selectVariant.itemText()}>
                    {item.title}
                  </Select.ItemText>
                  <Select.ItemIndicator className={selectVariant.itemIndicator()}>
                    <Icon name="sprite:check" className="size-4" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.ItemGroup>
          </Select.Content>
        </Select.Positioner>
      </Portal>
      <Select.HiddenSelect />
    </Select.Root>
  )
}, "FindoutOptions")

const FindoutComponent = reatomComponent(({ ctx }) => {
  const data = ctx.spy(authState.fields.findoutType)
  if (!data) return null;
  return FINDOUT_COMPONENTS?.[data] ?? null;
}, "FindoutComponent")

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

const RegisterStartInput = () => (
  <>
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
      <div className="flex flex-col gap-1.5 w-full">
        <span id="findout-label" className="text-sm font-medium text-neutral-300">
          {translate["auth.register.labels.findout"]()}
        </span>
        <FindoutOptions />
        <FindoutComponent />
      </div>
    </div>
    <PrivacyTerms />
  </>
)

const RegisterConfirmLoading = () => {
  return (
    <>
      <IconLoader className="size-9" />
      <div className="flex flex-col gap-1 justify-center items-center w-full">
        <Typography className="text-xl font-semibold">
          {translate["auth.register.in-progress"]()}
        </Typography>
        <Typography color="gray" className="text-sm">
          {translate["auth.register.in-progress-subtitle"]()}
        </Typography>
      </div>
    </>
  )
}
const RegisterConfirmError = reatomComponent(({ ctx }) => {
  const handleToBack = () => {
    spawn(ctx, (spawnCtx) => {
      registerNavigationModel.back(spawnCtx)
    })
  }

  return (
    <>
      <div className="flex flex-col gap-2 w-full items-center justify-center">
        <Icon name="sprite:x" className="text-[32px] text-red-600" />
        <p className="text-xl w-full sm:w-2/3 leading-5 font-semibold text-center">
          {translate["auth.register.error"]()}
        </p>
      </div>
      <Button
        background="default"
        type="button"
        onClick={handleToBack}
        className="font-semibold"
      >
        {translate["auth.register.to-back"]()}
      </Button>
    </>
  )
}, "RegisterConfirmError")

const RegisterConfirmSuccess = reatomComponent(({ ctx }) => {
  return (
    <>
      <div className="flex flex-col gap-2 w-full items-center justify-center">
        <Icon name="sprite:check" className="size-8 text-green-400" />
        <p className="text-xl w-full sm:w-2/3 leading-5 font-semibold text-center">
          {translate["auth.register.success"]()}
        </p>
      </div>
      <Button
        className="w-2/3 font-semibold"
        background="positive"
        onClick={() => register.toLogin(ctx)}
      >
        {translate["auth.register.toLogin"]()}
      </Button>
    </>
  )
}, "RegisterConfirmSuccess")

const REGISTER_CONFIRM_COMPONENTS: Record<"loading" | "error" | "success", (props: object) => JSX.Element> = {
  "loading": RegisterConfirmLoading,
  "error": RegisterConfirmError,
  "success": RegisterConfirmSuccess
}

const RegisterConfirm = reatomComponent(({ ctx }) => {
  const error = ctx.spy(authState.globalError)
  const isLoading = ctx.spy(register.submit.statusesAtom).isPending;
  const currentStep = isLoading ? "loading" : error ? "error" : "success";

  const Component = REGISTER_CONFIRM_COMPONENTS[currentStep]

  return (
    <div className="flex flex-col gap-6 w-full items-center justify-center">
      <Component />
    </div>
  )
}, "RegisterConfirm")

const RegisterBack = reatomComponent(({ ctx }) => {
  const canGoBack = ctx.spy(registerNavigationModel.canGoBackAtom);

  return (
    <Button
      type="button"
      disabled={!canGoBack || ctx.spy(registerNavigationModel.back.statusesAtom).isPending}
      onClick={() => spawn(ctx, (spawnCtx) => registerNavigationModel.back(spawnCtx))}
      background="default"
      className="capitalize"
    >
      {translate["shared.back"]()}
    </Button>
  )
}, "RegisterBack")
const RegisterContinue = reatomComponent(({ ctx }) => {
  const isPending = ctx.spy(registerNavigationModel.next.statusesAtom).isPending

  return (
    <Button
      type="button"
      background="positive"
      className="w-full font-semibold capitalize"
      disabled={isPending}
      withSpinner
      isLoading={isPending}
      onClick={() => {
        register.next(ctx)
        focusFirstAuthError(ctx)
      }}
    >
      {translate["shared.next"]()}
    </Button>
  )
}, "RegisterContinue")

const RegisterNavigation = reatomComponent(({ ctx }) => {
  if (ctx.spy(registerNavigationModel.isLastStepAtom)) return null;

  return (
    <div className="flex sm:flex-row flex-col items-center gap-2 justify-center w-full *:w-full">
      <RegisterBack />
      <RegisterContinue />
    </div>
  )
}, "RegisterNavigation")

const STEP_COMPONENTS: Record<AuthRegisterType, ReactNode> = {
  "start-input": <RegisterStartInput />,
  "confirm": <RegisterConfirm />
};

const RegisterContent = reatomComponent(({ ctx }) =>
  STEP_COMPONENTS[ctx.spy(registerState.type)], "RegisterContent"
)

export const RegisterForm = reatomComponent(({ ctx }) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    register.next(ctx);
    focusFirstAuthError(ctx)
  }

  return (
    <form className="flex flex-col gap-4 w-full h-full" onSubmit={handleSubmit}>
      <RegisterContent />
      <RegisterNavigation />
    </form>
  )
}, 'RegisterForm')
