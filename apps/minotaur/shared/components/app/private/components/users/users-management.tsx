import { Button } from "@/shared/ui/button"
import { dialogVariant, DialogClose } from "@/shared/ui/dialog"
import { ErrorBlock } from "@/shared/ui/error-block"
import { Input } from "@/shared/ui/input"
import { selectContentBaseStyle, selectVariant } from "@/shared/ui/select"
import { Dialog, DialogTitle } from "@ark-ui/react/dialog"
import { Portal } from "@ark-ui/react/portal"
import { createListCollection, Select } from "@ark-ui/react/select"
import { type SetAtom } from "@reatom/framework"
import { reatomComponent } from "@reatom/npm-react"
import { Icon } from "@/shared/ui/icon"
import {
  CREATE_USER_FIELDS, CREATE_USER_OPTIONS, CREATE_USER_ROLE_OPTIONS, DELETE_USER_FIELDS,
  usersAuth, usersAuthState, type CreateUserField, type CreateUserVariant,
  type DeleteUserField
} from "../../models/users.model"

const CreateUserFormField = reatomComponent<{ field: CreateUserField }>(({ ctx, field }) => {
  if (field.type === 'input') {
    return (
      <Input
        value={ctx.spy(field.value)}
        onChange={e => field.value(ctx, e.target.value)}
        placeholder={field.placeholder}
        required
      />
    )
  }

  const collection = createListCollection({
    items: field.options
  })

  // assertion because the expected value is string[], but number[] might be returned
  const value = Array.from(ctx.spy(field.value as SetAtom<CreateUserVariant>));

  const currentValue = value.map((d: number | CreateUserVariant) => {
    const B: Record<string, string> = {
      "number": CREATE_USER_ROLE_OPTIONS.find(item => item.value === Number(d))?.label ?? "unknown",
      "string": CREATE_USER_OPTIONS.find(item => item.value === String(d))?.label ?? "unknown"
    }
    return B[typeof d]
  }).join(", ")

  return (
    <Select.Root
      collection={collection}
      value={value}
      onValueChange={({ value }) => usersAuth.onValueChange(ctx, value, field)}
      className="w-full"
      multiple={field.multiple}
    >
      <Select.Control className={selectVariant.control()}>
        <Select.Trigger className={selectVariant.trigger()}>
          <Select.ValueText className="text-neutral-50">
            {currentValue}
          </Select.ValueText>
        </Select.Trigger>
        <div className={selectVariant.indicators()}>
          <Select.ClearTrigger className={selectVariant.clearTrigger()}>
            <Icon name='sprite:x' className="size-5" />
          </Select.ClearTrigger>
          <Select.Indicator className={selectVariant.indicator()}>
            <Icon name='sprite:selector' className="size-5" />
          </Select.Indicator>
        </div>
      </Select.Control>
      <Portal>
        <Select.Positioner>
          <Select.Content className={selectVariant.content()} style={selectContentBaseStyle}>
            <Select.ItemGroup className={selectVariant.itemGroup()}>
              {field.options.map((option, idx) => (
                <Select.Item key={idx} item={option} className={selectVariant.item()}>
                  <Select.ItemText>
                    {option.label}
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
}, "CreateUserFormField")

const CreateUserForm = reatomComponent(({ ctx }) => {
  const error = ctx.spy(usersAuth.createUser.submit.errorAtom);
  const isLoading = ctx.spy(usersAuth.createUser.submit.statusesAtom).isPending;

  return (
    <form
      onSubmit={(e) => usersAuth.createUser.submit(ctx, e)}
      className="flex flex-col gap-4 w-full"
    >
      <div className="flex flex-col gap-2 w-full">
        {CREATE_USER_FIELDS.map((field, idx) => <CreateUserFormField key={idx} field={field} />)}
      </div>
      {error && <ErrorBlock title={error.message} />}
      <Button
        type="submit"
        background="white"
        className="font-semibold"
        disabled={isLoading}
      >
        Создать
      </Button>
    </form>
  )
}, "CreateUserForm")

const CreateUser = reatomComponent(({ ctx }) => {
  return (
    <Dialog.Root
      open={ctx.spy(usersAuthState.createUser.isOpen)}
      onOpenChange={({ open }) => usersAuthState.createUser.isOpen(ctx, open)}
    >
      <Dialog.Trigger asChild>
        <Button background="default" className="text-sm font-semibold">
          Создать юзера
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop className={dialogVariant.backdrop()} />
        <Dialog.Positioner className={dialogVariant.positioner()}>
          <Dialog.Content className={dialogVariant.content("w-1/4")}>
            <DialogTitle className={dialogVariant.title()}>Создание юзера</DialogTitle>
            <CreateUserForm />
            <DialogClose />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}, "CreateUser")

const DeleteUserFormField = reatomComponent<{ field: DeleteUserField }>(({ ctx, field }) => {
  return (
    <Input
      value={ctx.spy(field.value)}
      placeholder={field.placeholder}
      required={field?.required ?? false}
      onChange={e => field.value(ctx, e.target.value)}
    />
  )
}, "DeleteUserFormField");

const DeleteUserForm = reatomComponent(({ ctx }) => {
  const error = ctx.spy(usersAuth.deleteUser.submit.errorAtom);

  return (
    <form
      onSubmit={e => usersAuth.deleteUser.submit(ctx, e)}
      className="flex flex-col gap-4 w-full"
    >
      <div className="flex flex-col gap-2 w-full">
        {DELETE_USER_FIELDS.map((field, idx) => <DeleteUserFormField key={idx} field={field} />)}
      </div>
      {error && <ErrorBlock title={error.message} />}
      <Button
        type="submit"
        background="white"
        className="font-semibold"
        withSpinner
        isLoading={ctx.spy(usersAuth.deleteUser.submit.statusesAtom).isPending}
        disabled={ctx.spy(usersAuth.deleteUser.submit.statusesAtom).isPending}
      >
        Удалить
      </Button>
    </form>
  )
}, "DeleteUserForm")

const DeleteUser = reatomComponent(({ ctx }) => {
  return (
    <Dialog.Root
      open={ctx.spy(usersAuthState.deleteUser.isOpen)}
      onOpenChange={({ open }) => usersAuthState.deleteUser.isOpen(ctx, open)}
    >
      <Dialog.Trigger asChild>
        <Button background="default" className="text-sm font-semibold">
          Удалить юзера
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop className={dialogVariant.backdrop()} />
        <Dialog.Positioner className={dialogVariant.positioner()}>
          <Dialog.Content className={dialogVariant.content("w-1/4")}>
            <DialogTitle className={dialogVariant.title()}>Удаление юзера</DialogTitle>
            <DeleteUserForm />
            <DialogClose />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}, "DeleteUser")

export const UsersManagement = () => {
  return (
    <div className="flex items-center w-full gap-2">
      <CreateUser />
      <DeleteUser />
    </div>
  )
}
