import { reatomComponent } from "@reatom/npm-react";
import { auth, authIsDisabledAtom, authState, type AuthType } from "../models/auth.model";
import { register, registerState } from "../models/register.model";
import { Input } from "@/shared/ui/input"
import { Icon, type IconName } from "@/shared/ui/icon"
import { ErrorBlock } from "@/shared/ui/error-block";
import { translate } from "@/shared/locales/helpers";
import { tabsTriggerVariants } from "@/shared/ui/tabs"
import { Tabs } from '@ark-ui/react/tabs'
import { type AtomMut } from "@reatom/framework";
import { type PropsWithChildren, type ReactNode } from "react";
import { LoginForm } from "./login";
import { RegisterForm } from "./register";

type AuthFieldProps = PropsWithChildren<{
  id: string,
  label: string,
  hint?: ReactNode
}>

export const AuthField = ({ id, label, hint, children }: AuthFieldProps) => (
  <div className="flex flex-col gap-1.5 w-full">
    <label htmlFor={id} className="text-sm font-medium text-neutral-300">
      {label}
    </label>
    {children}
    {hint}
  </div>
)

export const NicknameInput = reatomComponent<{ id?: string }>(({ ctx, id = "nickname" }) => {
  const invalid = ctx.spy(authState.errorsType).includes("nickname")
  const hasError = !!ctx.spy(authState.globalError)

  return (
    <Input
      id={id}
      data-auth-field="nickname"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck="false"
      className="w-full"
      variant={invalid ? "danger" : "default"}
      value={ctx.spy(authState.fields.nickname)}
      autoComplete="username"
      aria-label={translate["shared.nickname"]()}
      aria-invalid={invalid}
      aria-describedby={hasError ? "auth-error" : undefined}
      onClick={() => auth.resetError(ctx)}
      onChange={e => authState.fields.nickname(ctx, e.target.value)}
      placeholder={translate["auth.shared.placeholders.nickname"]()}
      maxLength={16}
    />
  )
}, "Nickname")

export const PasswordVisibility = reatomComponent<{ visibility: AtomMut<boolean> }>(({ ctx, visibility }) => {
  const visible = ctx.spy(visibility)
  const label = visible
    ? translate["auth.shared.password-visibility.hide"]()
    : translate["auth.shared.password-visibility.show"]();
  const icon: IconName = visible ? "sprite:eye-off" : "sprite:eye";

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={visible}
      className="
        absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center size-9 rounded-lg
        text-neutral-400 duration-150 hover:bg-neutral-700/50 hover:text-neutral-50
        focus-visible:outline-2 focus-visible:outline-green-400
      "
      onClick={() => visibility(ctx, state => !state)}
    >
      <Icon name={icon} className="size-5" />
    </button>
  )
}, "PasswordVisibility")

export const PasswordInput = reatomComponent<{ id?: string }>(({ ctx, id = "password" }) => {
  const invalid = ctx.spy(authState.errorsType).includes("password")
  const hasError = !!ctx.spy(authState.globalError)

  return (
    <div className="flex relative items-center justify-between w-full">
      <Input
        id={id}
        data-auth-field="password"
        className="w-full pr-12"
        variant={invalid ? "danger" : "default"}
        value={ctx.spy(authState.fields.password)}
        autoComplete={ctx.spy(authState.type) === "register" ? "new-password" : "current-password"}
        aria-label={translate["auth.shared.labels.password"]()}
        aria-invalid={invalid}
        aria-describedby={hasError ? "auth-error" : undefined}
        onClick={() => auth.resetError(ctx)}
        onChange={e => authState.fields.password(ctx, e.target.value)}
        placeholder={translate["auth.shared.placeholders.password"]()}
        maxLength={72}
        type={ctx.spy(authState.settings.showPassword) ? "text" : "password"}
      />
      <PasswordVisibility visibility={authState.settings.showPassword} />
    </div>
  )
}, "Password")

export const AuthError = reatomComponent(({ ctx }) => {
  const error = ctx.spy(authState.globalError)
  return error ? <ErrorBlock id="auth-error" title={error} raw /> : null
}, "AuthError")

const createAuthVariants = () => ([
  { label: translate["auth.navigation.auth.loginTitle"](), value: "login" },
  { label: translate["auth.navigation.auth.regTitle"](), value: "register" }
])

export const Auth = reatomComponent(({ ctx }) => {
  return (
    <Tabs.Root
      inert={ctx.spy(authIsDisabledAtom)}
      value={ctx.spy(authState.type)}
      onValueChange={(details) => {
        const next = details.value as AuthType
        if (next === ctx.get(authState.type)) return

        authState.type(ctx, next)
        register.resetRegisterState(ctx)
      }}
      className="
        flex flex-col gap-4 w-full p-4 sm:p-6 max-w-lg rounded-2xl border border-neutral-800
        bg-neutral-900/70 shadow-2xl shadow-black/30 withInert
      "
    >
      <Tabs.List
        aria-label={translate["auth.page.heading"]()}
        className="grid grid-cols-2 w-full gap-2"
      >
        {createAuthVariants().map((item) => (
          <Tabs.Trigger key={item.value} value={item.value} className={tabsTriggerVariants("h-10!")}>
            {item.label}
          </Tabs.Trigger >
        ))}
      </Tabs.List>
      {(ctx.spy(authState.type) === "login" || !ctx.spy(registerState.success)) && <AuthError />}
      <div className="flex flex-col gap-6 min-w-0 w-full h-full">
        <Tabs.Content value="register">
          <RegisterForm />
        </Tabs.Content>
        <Tabs.Content value="login">
          <LoginForm />
        </Tabs.Content>
      </div>
    </Tabs.Root>
  )
}, "Auth")
