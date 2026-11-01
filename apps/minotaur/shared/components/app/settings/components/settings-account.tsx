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

const CHANGE_PASSWORD_FIELDS = [
  { placeholder: translate["settings.account.sections.password-and-authentication.current-password"](), value: changePassState.currentPass },
  { placeholder: translate["settings.account.sections.password-and-authentication.new-password"](), value: changePassState.newPass },
  { placeholder: translate["settings.account.sections.password-and-authentication.repeat-password"](), value: changePassState.newPassRepeat }
]

const SettingsMainChangePassword = reatomComponent(({ ctx }) => {
  const error = ctx.spy(changePass.submit.errorAtom);

  return (
    <>
      <Button
        background="white"
        className="w-fit font-semibold"
        onClick={() => changePass.before(ctx)}
      >
        {translate["settings.account.sections.password-and-authentication.change-password"]()}
      </Button>
      <Dialog.Root
        open={ctx.spy(changePassState.isOpen)}
        onOpenChange={({ open }) => changePassState.isOpen(ctx, open)}
      >
        <Portal>
          <Dialog.Backdrop className={dialogVariant.backdrop()} />
          <DialogPositioner className={dialogVariant.positioner()}>
            <Dialog.Content className={dialogVariant.content("w-1/4!")}>
              <Dialog.Title className={dialogVariant.title()}>Изменение пароля</Dialog.Title>
              <form
                className="flex flex-col gap-6 w-full inert:opacity-60 inert:pointer-events-none"
                onSubmit={e => changePass.handle(ctx, e)}
                inert={ctx.spy(changePass.submit.statusesAtom).isPending}
              >
                <div className="flex flex-col gap-2 w-full">
                  {CHANGE_PASSWORD_FIELDS.map((field, idx) => (
                    <Input
                      key={idx}
                      placeholder={field.placeholder}
                      required
                      value={ctx.spy(field.value)}
                      onChange={e => field.value(ctx, e.target.value)}
                    />
                  ))}
                </div>
                {error && (
                  <ErrorBlock title={error?.message} />
                )}
                <div className="flex items-center w-full *:w-full gap-2">
                  <Dialog.CloseTrigger asChild>
                    <Button type="button" background="default" className="font-semibold">
                      {translate["shared.back"]()}
                    </Button>
                  </Dialog.CloseTrigger>
                  <Button type="submit" background="white" className="font-semibold">
                    {translate["settings.account.sections.password-and-authentication.confirm"]()}
                  </Button>
                </div>
              </form>
              <DialogClose />
            </Dialog.Content>
          </DialogPositioner>
        </Portal>
      </Dialog.Root>
    </>
  )
}, "ChangePassword")

const INFO_ACTIONS_LIST = [
  {
    label: "Скопировать UUID",
    action: (value: string) => action(async (ctx) => {
      await navigator.clipboard.writeText(value);
      toast.success(translate["shared.copyed-to-clipboard"]())
    }),
    value: "copy-uuid"
  }
]
const SettingsMainInfo = reatomComponent(({ ctx }) => {
  const currentUser = ctx.spy(currentUserState);
  if (!currentUser) return null;

  const { nickname, avatar, meta, uuid } = currentUser;

  return (
    <div className="flex flex-col gap-4 bg-neutral-800 rounded-xl p-4 w-full h-full">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Avatar url={avatar} nickname={nickname} className="h-12 w-12" />
          {nickname}
        </div>
        <Menu.Root
          onSelect={({ value }) => INFO_ACTIONS_LIST.find(d => d.value === value)?.action(uuid)(ctx)}
        >
          <Menu.Trigger className={menuVariant.trigger()}>
            <Icon name="sprite:dots" className="size-[22px] text-neutral-400" />
          </Menu.Trigger>
          <Portal>
            <Menu.Positioner>
              <Menu.Content className={menuVariant.content()}>
                {INFO_ACTIONS_LIST.map((item) => (
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
          Регистрация: {dayjs(meta.reg_date.toString()).format("DD.MM.YYYY")}
        </span>
        <span>
          Роль: {meta.role.name}
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
