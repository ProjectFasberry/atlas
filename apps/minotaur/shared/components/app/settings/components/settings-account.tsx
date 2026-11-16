import { reatomComponent } from "@reatom/npm-react"
import { Button } from "@/shared/ui/button"
import { Typography } from "@/shared/ui/typography"
import { type SettingsSectionItem } from "../models/settings.model"
import { SettingsContentWrapper, SettingsSection } from "./ui"
import { Dialog, DialogPositioner } from "@ark-ui/react/dialog"
import { Portal } from "@ark-ui/react/portal"
import { DialogClose,dialogVariant } from "@/shared/ui/dialog"
import { currentUserState } from "@/shared/models/current-user/index.model"
import { Avatar } from "@/shared/ui/avatar"
import { Menu } from "@ark-ui/react/menu"
import { menuVariant } from "@/shared/ui/menu"
import { Icon } from "@/shared/ui/icon"
import { dayjs } from "@/shared/lib/dayjs"
import { settingsAccountModel } from "../models/settings-account.model"
import { Input } from "@/shared/ui/input"
import { toast } from "sonner"
import { action } from "@reatom/framework"
import { useState } from "react"
import { passwordSchema } from "@/shared/schemas/auth"
import { ErrorBlock } from "@/shared/ui/error-block"
import { translate } from "@/shared/locales/helpers"

const { deleteAccount, changePass, changePassState } = settingsAccountModel()

const SettingsMainDeleteAccount = reatomComponent(({ ctx }) => {
  return (
    <Button
      className="w-fit self-start bg-red/80"
      onClick={() => deleteAccount.before(ctx)}
      disabled={ctx.spy(deleteAccount.submit.statusesAtom).isPending}
    >
      <Typography className="leading-5 font-semibold">
        {translate["settings.account.sections.delete-account.confirm"]()}
      </Typography>
    </Button>
  )
}, "DeleteAccount")

type PasswordFieldProps = {
  id: string
  label: string
  autoComplete: string
  value: string
  onChange: (value: string) => void
  minLength?: number
  error?: string | null
  autoFocus?: boolean
}

const PasswordField = ({
  id, label, autoComplete, value, onChange, minLength, error, autoFocus = false
}: PasswordFieldProps) => {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-neutral-300">{label}</label>
      <div className="relative">
        <Input
          id={id}
          type={isVisible ? "text" : "password"}
          autoComplete={autoComplete}
          minLength={minLength}
          maxLength={72}
          required
          autoFocus={autoFocus}
          variant={error ? "danger" : "default"}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="w-full pr-11"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          onClick={() => setIsVisible((state) => !state)}
          aria-label={isVisible
            ? translate["settings.account.hide-password"]()
            : translate["settings.account.show-password"]()}
          className="absolute right-1 top-1 flex size-8 items-center justify-center
            rounded-lg text-neutral-400 duration-150 hover:bg-neutral-700 hover:text-neutral-100"
        >
          <Icon name={isVisible ? "sprite:eye-off" : "sprite:eye"} className="size-4" />
        </button>
      </div>
      {error && (
        <span id={`${id}-error`} className="text-xs text-red-300">{error}</span>
      )}
    </div>
  )
}

const SettingsMainChangePassword = reatomComponent(({ ctx }) => {
  const isOpen = ctx.spy(changePassState.isOpen)
  const isPending = ctx.spy(changePass.submit.statusesAtom).isPending
  const serverError = ctx.spy(changePass.submit.errorAtom)
  const currentPass = ctx.spy(changePassState.currentPass)
  const newPass = ctx.spy(changePassState.newPass)
  const repeatPass = ctx.spy(changePassState.newPassRepeat)

  const parsed = passwordSchema.safeParse(newPass)
  const newPassError = newPass && !parsed.success
    ? parsed.error.issues[0]?.message ?? null
    : null
  const repeatError = repeatPass && repeatPass !== newPass
    ? translate["settings.account.passwords-mismatch"]()
    : null
  const submitDisabled = isPending || !currentPass || !newPass || !repeatPass
    || Boolean(newPassError) || Boolean(repeatError)

  const resetError = () => changePass.submit.errorAtom.reset(ctx)
  const changeCurrentPass = (value: string) => {
    resetError()
    changePassState.currentPass(ctx, value)
  }
  const changeNewPass = (value: string) => {
    resetError()
    changePassState.newPass(ctx, value)
  }
  const changeRepeatPass = (value: string) => {
    resetError()
    changePassState.newPassRepeat(ctx, value)
  }

  const handleOpenChange = ({ open }: { open: boolean }) => {
    if (!open && isPending) return

    changePassState.isOpen(ctx, open)
  }

  return (
    <>
      <Button
        background="white"
        className="w-fit font-semibold"
        onClick={() => changePass.before(ctx)}
      >
        {translate["settings.account.sections.password-and-authentication.change-password"]()}
      </Button>
      <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
        <Portal>
          <Dialog.Backdrop className={dialogVariant.backdrop()} />
          <DialogPositioner className={dialogVariant.positioner()}>
            <Dialog.Content className={dialogVariant.content(
              "max-h-[90dvh] items-stretch justify-start p-0 sm:max-w-md"
            )}>
              <DialogClose />
              <div className="flex w-full flex-col gap-1 border-b border-neutral-800 p-4 pr-12">
                <Dialog.Title className={dialogVariant.title("text-left")}>
                  {translate["settings.account.change-password-title"]()}
                </Dialog.Title>
              </div>
              <form
                className="flex w-full flex-col gap-4 overflow-y-auto p-4"
                onSubmit={e => changePass.handle(ctx, e)}
              >
                <div className="flex flex-col gap-3">
                  <PasswordField
                    id="change-password-current"
                    label={translate["settings.account.sections.password-and-authentication.current-password"]()}
                    autoComplete="current-password"
                    value={currentPass}
                    onChange={changeCurrentPass}
                    autoFocus
                  />
                  <PasswordField
                    id="change-password-new"
                    label={translate["settings.account.sections.password-and-authentication.new-password"]()}
                    autoComplete="new-password"
                    minLength={8}
                    value={newPass}
                    onChange={changeNewPass}
                    error={newPassError}
                  />
                  <PasswordField
                    id="change-password-repeat"
                    label={translate["settings.account.sections.password-and-authentication.repeat-password"]()}
                    autoComplete="new-password"
                    minLength={8}
                    value={repeatPass}
                    onChange={changeRepeatPass}
                    error={repeatError}
                  />
                </div>
                <Typography color="gray" className="text-xs">
                  {translate["settings.account.password-hint"]()}
                </Typography>
                {serverError && <ErrorBlock title={serverError.message} raw />}
                <div className="flex items-center justify-end gap-2 border-t border-neutral-800 pt-4">
                  <Dialog.CloseTrigger asChild>
                    <Button type="button" background="default" className="font-semibold" disabled={isPending}>
                      {translate["settings.account.change-password-cancel"]()}
                    </Button>
                  </Dialog.CloseTrigger>
                  <Button
                    type="submit"
                    background="white"
                    className="font-semibold"
                    withSpinner={true}
                    isLoading={isPending}
                    disabled={submitDisabled}
                  >
                    {translate["settings.account.sections.password-and-authentication.confirm"]()}
                  </Button>
                </div>
              </form>
            </Dialog.Content>
          </DialogPositioner>
        </Portal>
      </Dialog.Root>
    </>
  )
}, "ChangePassword")

const getInfoActions = () => [
  {
    label: translate["settings.account.uuid-copy"](),
    action: (value: string) => action(async (ctx) => {
      await navigator.clipboard.writeText(value);
      toast.success(translate["shared.copy.success"]())
    }),
    value: "copy-uuid"
  }
]
const SettingsMainInfo = reatomComponent(({ ctx }) => {
  const currentUser = ctx.spy(currentUserState);
  if (!currentUser) return null;

  const { nickname, avatar, meta, uuid } = currentUser;
  const infoActions = getInfoActions();

  return (
    <div className="flex flex-col gap-4 bg-neutral-800 rounded-xl p-4 w-full h-full">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Avatar url={avatar} nickname={nickname} className="h-12 w-12" />
          {nickname}
        </div>
        <Menu.Root
          onSelect={({ value }) => infoActions.find(d => d.value === value)?.action(uuid)(ctx)}
        >
          <Menu.Trigger className={menuVariant.trigger()} aria-label={translate["settings.actions"]()}>
            <Icon name="sprite:dots" className="size-[22px] text-neutral-400" />
          </Menu.Trigger>
          <Portal>
            <Menu.Positioner>
              <Menu.Content className={menuVariant.content()}>
                {infoActions.map((item) => (
                  <Menu.Item key={item.value} value={item.value} className={menuVariant.item()}>
                    {item.label}
                  </Menu.Item>
                ))}
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>
      </div>
      <div className="flex flex-col w-full gap-1">
        <span>
          {translate["settings.account.registration"]()}: {dayjs(meta.reg_date.toString()).format("DD.MM.YYYY")}
        </span>
        <span>
          {translate["settings.account.role"]()}: {meta.role.name}
        </span>
      </div>
    </div>
  )
}, "SettingsMainInfo")

const ACCOUNT_SECTIONS: SettingsSectionItem[] = [
  {
    title: translate["settings.account.sections.information.title"](),
    description: translate["settings.account.sections.information.description"](),
    children: <SettingsMainInfo />
  },
  {
    title: translate["settings.account.sections.password-and-authentication.title"](),
    description: translate["settings.account.sections.password-and-authentication.description"](),
    children: <SettingsMainChangePassword />
  },
  {
    title: translate["settings.account.sections.delete-account.title"](),
    description: translate["settings.account.sections.delete-account.description"](),
    children: <SettingsMainDeleteAccount />
  },
]

export const SettingsAccount = () => {
  return (
    <SettingsContentWrapper title={translate["settings.account.title"]()}>
      <div className="flex flex-col gap-8 w-full h-full">
        {ACCOUNT_SECTIONS.map((section, idx) => <SettingsSection key={idx} {...section} />)}
      </div>
    </SettingsContentWrapper>
  )
}
