import { reatomComponent, useUpdate } from "@reatom/npm-react";
import { Skeleton } from "@/shared/ui/skeleton";
import { Avatar } from "@/shared/ui/avatar";
import { Link } from "@/shared/components/config/link/link";
import { Typography } from "@/shared/ui/typography"
import { actions } from "../models/actions.model";
import { ButtonXSubmit } from "./ui";
import {
  createNews, createNewsState,
  editNews, editNewsState,
  deleteNews, newsList,
  createNewsStateFullImageUrlAtom,
  type NewsSingle
} from "../models/news.model"
import { Input } from "@/shared/ui/input"
import { type Atom, type AtomMut, type Ctx } from "@reatom/framework"
import { DeleteButton, EditButton, LinkButton, ActionButton } from "./ui"
import { EditorMenuBar } from "@/shared/components/config/editor/editor"
import { EditorContent, generateJSON, type JSONContent, useEditor, useEditorState } from "@tiptap/react"
import { CharacterCount, Placeholder } from "@tiptap/extensions"
import { editorExtensions } from "@/shared/components/config/editor/editor.model";
import { createPrivatedSectionModel } from "../models/shared.model";
import { storageModel } from "./storage";
import { Button } from "@/shared/ui/button";
import { Dialog } from "@ark-ui/react/dialog";
import { Portal } from "@ark-ui/react/portal";
import { DialogClose, dialogVariant } from "@/shared/ui/dialog";
import { useState, type ReactNode } from "react";
import { BackButton } from "@/shared/ui/back-button";
import { createLink } from "@/shared/components/config/link/link.model";

const NewsContentApply = reatomComponent<{
  tempContentAtom: Atom<string>,
  saveAction: (json: JSONContent) => void,
  isValidAtom: Atom<boolean>
}>(({ ctx, tempContentAtom, isValidAtom, saveAction }) => {
  const handle = () => {
    const contentStr = ctx.get(tempContentAtom)
    if (!contentStr) return

    const json = generateJSON(contentStr, editorExtensions)
    saveAction(json)
  }

  const isDisabled = !ctx.spy(isValidAtom)

  return <ActionButton variant="selected" icon="sprite:check" disabled={isDisabled} onClick={handle} />
}, "CreateNewsContentApply")

const NewsContent = reatomComponent<{
  initValue?: string | null | JSONContent,
  tempContentAtom: AtomMut<string>,
  isValidAtom: Atom<boolean>,
  saveAction: (ctx: Ctx, json: JSONContent) => void
}>(({
  ctx, tempContentAtom, initValue, saveAction, isValidAtom
}) => {
  const editor = useEditor({
    extensions: [
      ...editorExtensions,
      CharacterCount,
      Placeholder.configure({
        placeholder: 'Напишите что-нибудь...',
      }),
    ],
    content: initValue,
    onUpdate: ({ editor }) => {
      tempContentAtom(ctx, editor.getHTML())
    }
  })

  const { charactersCount, wordsCount } = useEditorState({
    editor,
    selector: (ctx) => {
      if (ctx.editor.isDestroyed) return {
        charactersCount: 0,
        wordsCount: 0,
      };

      return {
        charactersCount: ctx.editor.storage.characterCount.characters(),
        wordsCount: ctx.editor.storage.characterCount.words(),
      }
    },
  })

  return (
    <div className="flex flex-col group gap-4 w-full h-full">
      <div className="flex flex-col">
        <EditorMenuBar editor={editor} />
        <EditorContent
          editor={editor}
          className="border text-lg border-neutral-800 rounded-md bg-neutral-800"
        />
      </div>
      <div className="flex items-center justify-end gap-4 w-full">
        <div className="text-neutral-400 text-sm">
          {charactersCount}/{1024} символов ({wordsCount} слов)
        </div>
        <NewsContentApply
          tempContentAtom={tempContentAtom}
          isValidAtom={isValidAtom}
          saveAction={(json) => saveAction(ctx, json)}
        />
      </div>
    </div>
  )
}, "CreateNewsContent")

const EditNewsSubmit = reatomComponent(({ ctx }) => {
  const isDisabled = !ctx.spy(editNews.isValid) || ctx.spy(editNews.submit.statusesAtom).isPending

  return (
    <ButtonXSubmit
      onClick={() => editNews.submit(ctx)}
      disabled={isDisabled}
    />
  )
}, "EditNewsSubmit")
const EditNewsTitleInput = reatomComponent(({ ctx }) => {
  const old = ctx.get(editNewsState.title.historyAtom)[1]
  const value = ctx.spy(editNewsState.title)

  return (
    <Input
      value={value ?? old ?? ''}
      onChange={e => editNews.updateField(ctx, 'title', e.target.value)}
      placeholder="Заголовок"
    />
  )
}, "EditNewsTitleInput")
const EditNewsDescInput = reatomComponent(({ ctx }) => {
  const old = ctx.get(editNewsState.description.historyAtom)[1]
  const value = ctx.spy(editNewsState.description)

  return (
    <Input
      value={value ?? old ?? ''}
      onChange={e => editNews.updateField(ctx, 'description', e.target.value)}
      placeholder="Описание"
    />
  )
}, "EditNewsDescInput")
const EditNewsForm = reatomComponent(({ ctx }) => {
  const item = ctx.spy(editNews.item);
  if (!item) return <Typography>Выбранный объект не найден</Typography>

  return (
    <div className="flex flex-col w-full gap-2">
      <EditNewsTitleInput />
      <EditNewsDescInput />
      <div className="flex flex-col gap-2 w-full">
        <NewsContent
          isValidAtom={editNews.isValid}
          initValue={item.content as JSONContent}
          tempContentAtom={editNewsState.tempContent}
          saveAction={editNews.saveContent}
        />
      </div>
    </div>
  )
}, "EditNewsForm")

//#region Create
const fields = [
  { label: "Заголовок", atom: createNewsState.title },
  { label: "Описание", atom: createNewsState.desc },
]
const CreateNewsField = reatomComponent<typeof fields[number]>(({ ctx, label, atom }) => {
  return (
    <Input
      placeholder={label}
      value={ctx.spy(atom)}
      onChange={(e) => atom(ctx, e.target.value)}
    />
  )
}, "CreateNewsField")

const { Storage } = storageModel({
  name: "create-news",
  as: "menu",
  Slot: (
    <Button background="white" className="text-sm h-8 font-semibold">
      Открыть хранилище
    </Button>
  ),
  onSelectFile(ctx, fileName) {
    createNewsState.imageUrl.data(ctx, fileName)
    createNewsState.imageUrl.isError.reset(ctx)
    createNewsState.imageUrl.isLoading.reset(ctx)
    createNewsState.imageUrl.isOpen.reset(ctx)
  }
})

type Variant = "input-url" | "null";

const VARIANTS: Record<Variant, ({ ctx, setVariant }: { ctx: Ctx, setVariant: (state: Variant) => void }) => ReactNode> = {
  "input-url": ({ ctx, setVariant }) => (
    <div className="flex items-center justify-center gap-1 w-full">
      <BackButton onClick={() => setVariant("null")} event="custom" />
      <form
        className="flex items-center gap-1"
        onSubmit={(e) => createNews.imageUrl.submit(ctx, e)}
      >
        <Input
          ref={el => createNews.imageUrl.setupRef(ctx, el)}
          required
          placeholder="Ссылка на изображение"
          className="w-full bg-neutral-700! placeholder:text-sm h-8"
        />
        <Button type="submit" background="white" className="text-sm font-semibold h-8">
          Применить
        </Button>
      </form>
    </div>
  ),
  "null": ({ setVariant }) => (
    <div className="flex items-center w-full justify-center gap-2">
      <Button background="default" onClick={() => setVariant("input-url")} className="text-sm font-semibold h-8">
        Вставить ссылку
      </Button>
      <Storage />
    </div>
  )
}

const CreateNewsImageVariants = reatomComponent(({ ctx }) => {
  const [variant, setVariant] = useState<Variant>("null");
  const Component = VARIANTS[variant];
  return Component({ ctx, setVariant })
}, "CreateNewsImageVariants")

const CreateNewsImage = reatomComponent(({ ctx }) => {
  const data = ctx.spy(createNewsState.imageUrl.data);

  const isExist = data && data.length >= 1;
  const isError = ctx.spy(createNewsState.imageUrl.isError)
  const isLoading = ctx.spy(createNewsState.imageUrl.isLoading)

  const onError = () => {
    createNewsState.imageUrl.isError(ctx, true)
    createNewsState.imageUrl.isLoading(ctx, false)
  }

  const onLoad = () => {
    createNewsState.imageUrl.isLoading(ctx, false)
  }

  const onDelete = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    createNewsState.imageUrl.data(ctx, "")
    createNewsState.imageUrl.isError(ctx, false)
    createNewsState.imageUrl.isLoading(ctx, false)
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="h-44 w-2/3 bg-neutral-800 rounded-xl">
        {isExist ? (
          <Dialog.Root
            open={ctx.spy(createNewsState.imageUrl.isOpen)}
            onOpenChange={({ open }) => createNews.imageUrl.handleOpen(ctx, open)}
          >
            <Dialog.Trigger className="relative flex items-center justify-center w-full h-full">
              {isError && <span className="text-sm text-red">Ошибка загрузки</span>}
              {isLoading && <span className="text-sm">Загрузка...</span>}
              <img
                src={ctx.spy(createNewsStateFullImageUrlAtom)}
                alt=" "
                className="h-full w-full object-cover rounded-lg hover:brightness-75 duration-150"
                onError={onError}
                onLoad={onLoad}
                style={{
                  display: (isLoading || isError) ? 'none' : 'block'
                }}
              />
              <DeleteButton className="absolute top-2 right-2" onClick={onDelete} />
            </Dialog.Trigger>
            <Portal>
              <Dialog.Backdrop className={dialogVariant.backdrop()} />
              <Dialog.Positioner className={dialogVariant.positioner()}>
                <Dialog.Content className={dialogVariant.content("p-0! max-h-[720px]")}>
                  <img
                    src={ctx.spy(createNewsStateFullImageUrlAtom)}
                    alt=""
                    loading="lazy"
                    className="h-auto w-auto object-contain rounded-lg"
                  />
                  <DialogClose />
                </Dialog.Content>
              </Dialog.Positioner>
            </Portal>
          </Dialog.Root>
        ) : (
          <div className="flex flex-col gap-4 overflow-hidden items-center justify-center h-full w-full">
            <div className="flex flex-col items-center justify-center w-full">
              <span>Не выбрано</span>
              <span className="text-sm w-[60%] leading-4 text-center text-neutral-400">
                Введите ссылку на изображение или выберите загруженный файл
              </span>
            </div>
            <CreateNewsImageVariants />
          </div>
        )}
      </div>
    </div>
  )
}, "CreateNewsImage")

const CreateNewsSubmit = reatomComponent(({ ctx }) => {
  const isDisabled = !ctx.spy(createNews.isValid) || ctx.spy(createNews.submit.statusesAtom).isPending

  return (
    <ButtonXSubmit
      onClick={() => createNews.submit(ctx)}
      disabled={isDisabled}
    />
  )
}, "CreateNewsSubmit")

const CreateNewsForm = () => {
  return (
    <div className="flex flex-col gap-2 w-full">
      {fields.map((field, idx) => <CreateNewsField key={idx} label={field.label} atom={field.atom} />)}
      <CreateNewsImage />
      <div className="flex flex-col gap-2 w-full">
        <NewsContent
          isValidAtom={createNews.contentIsValid}
          saveAction={createNews.saveContent}
          tempContentAtom={createNewsState.tempContent}
        />
      </div>
    </div>
  )
}
//#endregion;

const UserBadge = ({ nickname, avatar }: { nickname: string; avatar: string }) => {
  return (
    <Link
      href={createLink("player", nickname)}
      className="flex items-center gap-1"
    >
      <Avatar
        nickname={nickname}
        url={avatar}
        className="w-5 h-5"
      />
      <Typography>
        {nickname}
      </Typography>
    </Link>
  )
}

const NewsListItem = reatomComponent<NewsSingle>(({ ctx, id, title, imageUrl, creator }) => {
  return (
    <div
      className="flex h-22 border border-neutral-800 p-2
        rounded-lg overflow-hidden items-center gap-2 justify-between w-full"
    >
      <div className="flex items-center gap-2">
        <img
          src={imageUrl}
          alt={title}
          className="h-18 w-28 rounded-lg select-none object-cover"
        />
        <div className="flex flex-col items-start gap-1">
          <Typography className="font-semibold">
            {title}
          </Typography>
          <div className="flex items-center gap-3 w-full justify-start">
            <UserBadge avatar={creator.avatar} nickname={creator.nickname} />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <LinkButton link={createLink("news", id)} />
        <EditButton
          onClick={() => actions.createLinkValue(ctx, { parent: "news", type: "edit", target: id.toString() })}
        />
        <DeleteButton
          onClick={() => deleteNews.deleteBefore(ctx, { id, title })}
          disabled={ctx.spy(deleteNews.submit.statusesAtom).isPending}
        />
      </div>
    </div>
  )
}, "NewsListItem")

const NewsList = reatomComponent(({ ctx }) => {
  useUpdate(newsList.fetch, [])

  if (ctx.spy(newsList.fetch.statusesAtom).isFirstPending) {
    return (
      <div className="flex flex-col w-full gap-2 h-full">
        {Array.from({ length: 6 }).map((_, idx) => <Skeleton key={idx} className="h-16 w-full" />)}
      </div>
    )
  }

  const error = ctx.spy(newsList.fetch.errorAtom);
  if (error) return <span className="text-red text-sm">{error.message}</span>

  const data = ctx.spy(newsList.fetch.dataAtom)?.data;
  if (!data) return null;

  return (
    <div className="flex flex-col w-full gap-2 h-full">
      {data.map(news => <NewsListItem key={news.id} {...news} />)}
    </div>
  )
}, "NewsList")

export const newsSection = createPrivatedSectionModel({
  event: "news",
  components: {
    header: {
      create: <CreateNewsSubmit />,
      edit: <EditNewsSubmit />
    },
    content: {
      create: <CreateNewsForm />,
      edit: <EditNewsForm />,
      view: <NewsList />
    }
  }
})
