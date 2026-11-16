import { reatomComponent, useUpdate } from "@reatom/npm-react";
import { dict, dictionariesEdit, dictState, type DictionariesItem } from "../models/dictionaries.model";
import { Typography } from "@/shared/ui/typography"
import { ActionButton, DeleteButton, EditButton } from "./ui";
import { Input } from "@/shared/ui/input";
import { ButtonXSubmit } from "./ui";
import { createPrivatedSectionModel } from "../models/shared.model";
import { Skeleton } from "@/shared/ui/skeleton";
import { ErrorBlock } from "@/shared/ui/error-block";
import { Noop } from "@/shared/ui/noop";
import { translate } from "@/shared/locales/helpers"

type DictionariesListItemProps = Omit<DictionariesItem, "key"> & {
  itemKey: string
}

const DictionariesListItem = reatomComponent<DictionariesListItemProps>(({ ctx, id, itemKey, value }) => {
  const isEdit = ctx.spy(dictionariesEdit.getIsEdit(id));

  const editIsLoading = ctx.spy(dict.edit.statusesAtom).isPending

  return (
    <div className="flex justify-between items-center gap-1 p-2 border border-neutral-800 rounded-lg">
      <div className="flex items-center gap-2">
        {isEdit ? (
          <Input
            value={ctx.spy(dictState.editKey) ?? itemKey}
            onChange={e => dictState.editKey(ctx, e.target.value)}
            className="h-6"
          />
        ) : (
          <Typography className="text-neutral-400 text-sm">
            [{itemKey}]
          </Typography>
        )}
        {isEdit ? (
          <Input
            value={ctx.spy(dictState.editValue) ?? value}
            onChange={e => dictState.editValue(ctx, e.target.value)}
            className="h-6"
          />
        ) : (
          <Typography>
            {value}
          </Typography>
        )}
      </div>
      <div className="flex items-center gap-1">
        {isEdit ? (
          <>
            <ActionButton
              icon="sprite:arrow-back-up"
              disabled={editIsLoading}
              onClick={() => dictionariesEdit.resetFull(ctx)}
            />
            <ActionButton
              variant="selected"
              onClick={() => dict.edit(ctx, id)}
              icon="sprite:check"
              disabled={!ctx.spy(dictionariesEdit.isValid) || editIsLoading}
            />
          </>
        ) : (
          <>
            <EditButton
              disabled={editIsLoading}
              onClick={() => dictionariesEdit.start(ctx, id)}
            />
            <DeleteButton
              disabled={ctx.spy(dict.delete.statusesAtom).isPending}
              onClick={() => dict.deleteBefore(ctx, { id, title: itemKey })}
            />
          </>
        )}
      </div>
    </div >
  )
}, "DictionariesListItem")

const DictionariesListSkeleton = () => (
  <div className="flex flex-col gap-1 w-full h-full">
    {Array.from({ length: 6 }).map((_, idx) => <Skeleton key={idx} className="h-12 w-full" />)}
  </div>
)

const DictionariesList = reatomComponent(({ ctx }) => {
  useUpdate(dict.fetchList, [])

  if (ctx.spy(dict.fetchList.statusesAtom).isFirstPending) return <DictionariesListSkeleton/>

  const error = ctx.spy(dict.fetchList.errorAtom)
  if (error) return <ErrorBlock title={error.message} />

  const data = ctx.spy(dict.fetchList.dataAtom)
  if (!data) return <Noop />

  return (
    <div className="flex flex-col gap-1 w-full h-full">
      {data.map((o) => <DictionariesListItem key={o.id} itemKey={o.key} value={o.value} created_at={o.created_at} id={o.id} />)}
    </div>
  )
}, "DictionariesList")

const CreateDictionariesKeyInput = reatomComponent(({ ctx }) => {
  return (
    <Input
      placeholder={translate["panel.key"]()}
      value={ctx.spy(dictState.createKey)}
      onChange={(e) => dictState.createKey(ctx, e.target.value)}
    />
  )
}, "CreateDictionariesKeyInput")
const CreateDictionariesValueInput = reatomComponent(({ ctx }) => {
  return (
    <Input
      placeholder={translate["panel.value"]()}
      value={ctx.spy(dictState.createValue)}
      onChange={(e) => dictState.createValue(ctx, e.target.value)}
    />
  )
}, "CreateDictionariesValueInput")
const CreateDictionariesSubmit = reatomComponent(({ ctx }) => {
  return (
    <ButtonXSubmit
      disabled={ctx.spy(dict.create.statusesAtom).isPending}
      onClick={() => dict.create(ctx)}
    />
  )
}, "DictionariesCreate")
const CreateDictionariesForm = () => {
  return (
    <div className="flex flex-col gap-2 w-full">
      <CreateDictionariesKeyInput />
      <CreateDictionariesValueInput />
    </div>
  )
}

export const dictionariesSection = createPrivatedSectionModel({
  event: "dictionaries",
  components: {
    header: {
      create: <CreateDictionariesSubmit />,
      edit: null
    },
    content: {
      view: <DictionariesList />,
      create: <CreateDictionariesForm />,
      edit: null
    }
  }
})
