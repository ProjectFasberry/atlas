import { reatomComponent } from "@reatom/npm-react";
import { auth, authIsDisabledAtom, authState, type AuthType } from "../models/auth.model";
import { Input } from "@/shared/ui/input"
import { Icon, type IconName } from "@/shared/ui/icon"
import { ErrorBlock } from "@/shared/ui/error-block";
import { translate } from "@/shared/locales/helpers";
import { tabsTriggerVariants } from "@/shared/ui/tabs"
import { Tabs } from '@ark-ui/react/tabs'
import { Link } from "@/shared/components/config/link/link";
import { showResetPasswordAtom } from "../models/login.model";
import { LoginForm } from "./login";
import { RegisterForm } from "./register";

export const NicknameInput = reatomComponent(({ ctx }) => (
  <Input
    id="nickname"
    autoCorrect="off"
    autoCapitalize="off"
    spellCheck="false"
    className="w-full"
    variant={ctx.spy(authState.errorsType).includes("nickname") ? "danger" : "default"}
    value={ctx.spy(authState.fields.nickname)}
    autoComplete="nickname"
    onClick={() => auth.resetError(ctx)}
    onChange={e => authState.fields.nickname(ctx, e.target.value)}
    placeholder={translate["auth.shared.placeholders.nickname"]()}
    maxLength={32}
  />
), "Nickname")

const PASSWORD_VISIBILITY_ICONS: Record<string, IconName> = {
  "show": "sprite:eye",
  "hide": "sprite:eye-off"
}

const PasswordVisibility = reatomComponent(({ ctx }) => {
  const variant = ctx.spy(authState.settings.showPassword) ? "show" : "hide";

  return (
    <button
      type="button"
      className="absolute right-0 top-1/2 -translate-1/2"
      onClick={() => authState.settings.showPassword(ctx, (state) => !state)}
    >
      <Icon
        name={PASSWORD_VISIBILITY_ICONS[variant]}
        className="duration-150 ease-in size-5 hover:text-neutral-50 text-neutral-400"
      />
    </button>
  )
}, "PasswordVisibility")

export const PasswordInput = reatomComponent(({ ctx }) => (
  <div className="flex relative items-center justify-between w-full">
    <Input
      id="password"
      className="w-full"
      variant={ctx.spy(authState.errorsType).includes("password") ? "danger" : "default"}
      value={ctx.spy(authState.fields.password)}
      autoComplete="password"
      onClick={() => auth.resetError(ctx)}
      onChange={e => authState.fields.password(ctx, e.target.value)}
      placeholder={translate["auth.shared.placeholders.password"]()}
      maxLength={64}
      type={ctx.spy(authState.settings.showPassword) ? "text" : "password"}
    />
    <PasswordVisibility />
  </div>
), "Password")

export const AuthError = reatomComponent(({ ctx }) => {
  const error = ctx.spy(authState.globalError)
  return error ? <ErrorBlock title={error} /> : null
}, "AuthError")

export const ResetPassword = reatomComponent(({ ctx }) => {
  if (!ctx.spy(showResetPasswordAtom)) return null;

  return (
    <Link href="/auth/restore" className='flex items-center justify-center w-full text-sm text-neutral-400'>
      {translate["auth.navigation.auth.recoveryTitle"]()}
    </Link>
  )
}, "ResetPassword")

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
        authState.type(ctx, details.value as AuthType)
      }}
      className="flex flex-col gap-4 w-full p-3 sm:p-4 lg:p-6 max-w-lg rounded-lg bg-neutral-900 withInert"
    >
      <Tabs.List
        className="flex flex-col sm:flex-row min-h-24 h-24 sm:min-h-fit sm:h-fit w-full gap-2 *:h-10 *:w-full"
      >
        {createAuthVariants().map((item) => (
          <Tabs.Trigger key={item.value} value={item.value} className={tabsTriggerVariants()}>
            {item.label}
          </Tabs.Trigger >
        ))}
      </Tabs.List>
      <div className="flex flex-col gap-6 min-w-0 w-full h-full">
        <Tabs.Content value="register">
          <RegisterForm />
        </Tabs.Content>
        <Tabs.Content value="login">
          <LoginForm />
        </Tabs.Content>
        <ResetPassword />
      </div>
    </Tabs.Root>
  )
}, "Auth")
