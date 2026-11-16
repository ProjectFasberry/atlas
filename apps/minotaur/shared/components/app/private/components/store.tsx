import { DeleteButton, EditButton, SectionWrapper, LinkButton, sectionActionVariant } from "@/shared/components/app/private/components/ui"
import {
  itemToEditAtom, editStoreItem, editStoreItemState, deleteStoreItem, duplicateStoreItem,
  storeState, storeItems, createStoreItem, createStoreItemState
} from "@/shared/components/app/private/models/store.model"
import { EditorMenuBar } from "@/shared/components/config/editor/editor"
import { action, atom, type AtomState, type Ctx, type CtxSpy } from "@reatom/framework"
import { reatomComponent, useUpdate } from "@reatom/npm-react"
import { Button } from "@/shared/ui/button"
import { Skeleton } from "@/shared/ui/skeleton"
import { Typography } from "@/shared/ui/typography"
import { Icon } from "@/shared/ui/icon"
import { type PropsWithChildren, type ReactNode } from "react"
import { navigate } from "vike/client/router"
import { EditorContent, useEditor, type JSONContent } from "@tiptap/react"
import { getFromDictionary } from "@/shared/models/app/utils"
import { type StoreItem as StoreItemProps } from "../../shop/models/store-item.model"
import { editorExtensions } from "@/shared/components/config/editor/editor.model"
import { normalizeTiptapContent } from "@/shared/lib/tiptap-content"
import { ErrorBlock } from "@/shared/ui/error-block"
import { Input } from "@/shared/ui/input";
import { Portal } from '@ark-ui/react/portal'
import { Select, createListCollection } from '@ark-ui/react/select'
import { selectContentBaseStyle, selectVariant } from "@/shared/ui/select"
import { createLink } from "@/shared/components/config/link/link.model"
import { getStaticImage } from "@/shared/lib/helpers"
import { createStoreItemValidationAtom } from "@/shared/components/app/private/models/store.model"

const currencyValues = ["CHARISM", "BELKOIN"];
const getCurrencyTitle = (ctx: Ctx, val: string) => getFromDictionary(ctx, val)

const CURRENCY_ITEMS = (ctx: Ctx) => currencyValues.map((value) => ({
  value,
  title: getCurrencyTitle(ctx, value),
}));

const TYPE_ITEMS = [
  { title: "Ивент", value: "event" }, { title: "Донат", value: "donate" }
]

const createTouchedAtom = atom<Set<string>>(new Set<string>(), "createStoreItemTouched")
const createAttemptedAtom = atom(false, "createStoreItemAttempted")

const markCreateTouched = action((ctx, field: string) => {
  const next = new Set(ctx.get(createTouchedAtom))
  next.add(field)
  createTouchedAtom(ctx, next)
}, "createStoreItemTouched.mark")

const Field = ({ label, required, hint, error, children }: PropsWithChildren<{
  label: string
  required?: boolean
  hint?: string
  error?: string
}>) => (
  <div className="flex flex-col gap-1 w-full">
    <span className="text-xs font-medium text-neutral-400">
      {label}
      {required && <span className="text-red"> *</span>}
    </span>
    {children}
    {error && <span className="text-[11px] text-red">{error}</span>}
    {!error && hint && <span className="text-[11px] text-neutral-500">{hint}</span>}
  </div>
)

const uploadLabel = ({ imageUploading, imgUrl }: { imageUploading: boolean, imgUrl?: string | null }) => {
  if (imageUploading) return "Загрузка…"
  if (imgUrl) return "Заменить"
  return "Выбрать файл"
}

const fieldError = (ctx: CtxSpy, field: string, errors: Record<string, string>) => {
  if (!ctx.spy(createAttemptedAtom) && !ctx.spy(createTouchedAtom).has(field)) return undefined
  return errors[field]
}

const textareaClass = `
  px-4 py-2 min-h-20 text-sm rounded-xl placeholder:text-neutral-400
  bg-neutral-800 border outline-none border-transparent resize-y
  focus-within:ring-2 focus-within:ring-inset focus-within:ring-green-500
`

export const CreateItem = reatomComponent(({ ctx }) => {
  const editor = useEditor({
    extensions: editorExtensions,
    onUpdate: ({ editor }) => {
      createStoreItemState.content(ctx, editor.getJSON())
    }
  })

  const items = CURRENCY_ITEMS(ctx)
  const collectionf = createListCollection({ items })
  const collectionss = createListCollection({ items: TYPE_ITEMS })

  const validation = ctx.spy(createStoreItemValidationAtom)
  const imageUploading = ctx.spy(createStoreItemState.imageUploading)
  const imageError = ctx.spy(createStoreItemState.imageError)
  const imgUrl = ctx.spy(createStoreItemState.imgUrl)
  const pending = ctx.spy(createStoreItem.submit.statusesAtom).isPending
  const typeTitle = TYPE_ITEMS.find((item) => item.value === ctx.spy(createStoreItemState.type))?.title ?? ""

  const onFile = (file: File | undefined) => {
    if (!file) return
    createStoreItemState.imageError(ctx, null)
    createStoreItem.uploadImage(ctx, file)
  }

  return (
    <div className="grid gap-3 w-full h-full lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
      <div className="flex flex-col gap-3 w-full">
        <Field label="Название" required error={fieldError(ctx, "title", validation.errors)}>
          <Input
            value={ctx.spy(createStoreItemState.title)}
            onChange={e => createStoreItemState.title(ctx, e.target.value)}
            onBlur={() => markCreateTouched(ctx, "title")}
            placeholder="Например, «Архонт»"
          />
        </Field>

        <Field label="Описание" hint="Короткий текст под названием в магазине">
          <textarea
            value={ctx.spy(createStoreItemState.description) ?? ""}
            onChange={e => createStoreItemState.description(ctx, e.target.value || null)}
            placeholder="Что получает игрок"
            className={textareaClass}
          />
        </Field>

        <div className="grid gap-2 sm:grid-cols-2">
          <Field label="Тип" required>
            <Select.Root
              collection={collectionss}
              value={ctx.spy(createStoreItemState.type) ? [ctx.spy(createStoreItemState.type)!] : []}
              onValueChange={({ value }) => createStoreItemState.type(ctx, value[0] as AtomState<typeof createStoreItemState.type>)}
            >
              <Select.Control className={selectVariant.control()}>
                <Select.Trigger className={selectVariant.trigger()}>
                  <Select.ValueText>{typeTitle}</Select.ValueText>
                </Select.Trigger>
                <div className={selectVariant.indicators()}>
                  <Select.Indicator className={selectVariant.indicator()}>
                    <Icon name="sprite:selector" className="size-5" />
                  </Select.Indicator>
                </div>
              </Select.Control>
              <Portal>
                <Select.Positioner>
                  <Select.Content className={selectVariant.content()} style={selectContentBaseStyle}>
                    <Select.ItemGroup className={selectVariant.itemGroup()}>
                      {TYPE_ITEMS.map((item) => (
                        <Select.Item key={item.value} item={item} className={selectVariant.item()}>
                          <Select.ItemText className={selectVariant.itemText()}>{item.title}</Select.ItemText>
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
          </Field>

          <Field label="Валюта" required>
            <Select.Root
              collection={collectionf}
              value={[ctx.spy(createStoreItemState.currency)]}
              onValueChange={({ value }) => createStoreItemState.currency(ctx, value[0] as AtomState<typeof createStoreItemState.currency>)}
            >
              <Select.Control className={selectVariant.control()}>
                <Select.Trigger className={selectVariant.trigger()}>
                  <Select.ValueText>{getCurrencyTitle(ctx, ctx.spy(createStoreItemState.currency))}</Select.ValueText>
                </Select.Trigger>
                <div className={selectVariant.indicators()}>
                  <Select.Indicator className={selectVariant.indicator()}>
                    <Icon name="sprite:selector" className="size-5" />
                  </Select.Indicator>
                </div>
              </Select.Control>
              <Portal>
                <Select.Positioner>
                  <Select.Content className={selectVariant.content()} style={selectContentBaseStyle}>
                    <Select.ItemGroup className={selectVariant.itemGroup()}>
                      {items.map((item) => (
                        <Select.Item key={item.value} item={item} className={selectVariant.item()}>
                          <Select.ItemText className={selectVariant.itemText()}>{item.title}</Select.ItemText>
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
          </Field>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Field label="Цена" required error={fieldError(ctx, "price", validation.errors)}>
            <Input
              value={ctx.spy(createStoreItemState.price) ?? ""}
              onChange={e => createStoreItemState.price(ctx, e.target.value)}
              onBlur={() => markCreateTouched(ctx, "price")}
              placeholder="0"
              type="number"
              min={0}
            />
          </Field>

          <Field label="Значение" required hint="Что подставляется в команду как {value}" error={fieldError(ctx, "value", validation.errors)}>
            <Input
              value={ctx.spy(createStoreItemState.value) ?? ""}
              onChange={e => createStoreItemState.value(ctx, e.target.value)}
              onBlur={() => markCreateTouched(ctx, "value")}
              placeholder="Например, 1"
            />
          </Field>
        </div>

        <Field
          label="Команда выдачи"
          hint="Токены {player} и {value}; команда выполняется от консоли"
          error={fieldError(ctx, "command", validation.errors)}
        >
          <Input
            value={ctx.spy(createStoreItemState.command) ?? ""}
            onChange={e => createStoreItemState.command(ctx, e.target.value)}
            onBlur={() => markCreateTouched(ctx, "command")}
            placeholder="give {player} diamond 1"
          />
        </Field>

        <Field label="Команда возврата" hint="Необязательно: что выполнить при возврате">
          <Input
            value={ctx.spy(createStoreItemState.refundCmd) ?? ""}
            onChange={e => createStoreItemState.refundCmd(ctx, e.target.value || null)}
            placeholder="take {player} diamond 1"
          />
        </Field>

        <Field
          label="Картинка"
          hint="PNG, JPEG или WebP до 2 МБ"
          error={imageError ?? undefined}
        >
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex h-10 items-center rounded-xl bg-neutral-800 px-4 text-sm cursor-pointer hover:bg-neutral-700">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                disabled={imageUploading}
                onChange={e => onFile(e.target.files?.[0])}
              />
              {uploadLabel({ imageUploading, imgUrl })}
            </label>
            {imgUrl && (
              <>
                <img
                  src={getStaticImage(imgUrl)}
                  alt=""
                  className="size-10 rounded-lg object-cover"
                />
                <Button
                  background="default"
                  className="h-10 px-3 text-xs"
                  onClick={() => createStoreItemState.imgUrl(ctx, null)}
                >
                  Убрать
                </Button>
              </>
            )}
          </div>
        </Field>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-neutral-400">Содержимое</span>
          <div className="flex flex-col">
            <EditorMenuBar editor={editor} />
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      <aside className="flex flex-col gap-2 rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 lg:sticky lg:top-2">
        <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          Предпросмотр
        </span>
        <img
          src={imgUrl ? getStaticImage(imgUrl) : getStaticImage("icons/adventure_icon.png")}
          alt=""
          className="aspect-square w-full rounded-lg object-cover bg-neutral-800"
        />
        <Typography className="font-semibold truncate">
          {ctx.spy(createStoreItemState.title) || "Название товара"}
        </Typography>
        <Typography color="gray" className="text-xs line-clamp-3">
          {ctx.spy(createStoreItemState.description) || "Описание товара"}
        </Typography>
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="font-semibold">
            {ctx.spy(createStoreItemState.price) || "0"} {getCurrencyTitle(ctx, ctx.spy(createStoreItemState.currency))}
          </span>
          <span className="rounded-lg bg-neutral-800 px-1.5 py-0.5 text-[11px] text-neutral-400">
            {typeTitle}
          </span>
        </div>

        <Button
          className="h-10 w-full items-center gap-2 justify-center px-4 bg-neutral-800 mt-2"
          onClick={() => {
            createAttemptedAtom(ctx, true)
            if (validation.valid) createStoreItem.submit(ctx)
          }}
          disabled={pending || imageUploading}
        >
          <Typography className="font-semibold text-lg text-neutral-50">
            Создать
          </Typography>
          <Icon name="sprite:check" className="size-4.5" />
        </Button>

        {!validation.valid && ctx.spy(createAttemptedAtom) && (
          <span className="text-[11px] text-red">
            Заполните обязательные поля: {Object.keys(validation.errors).join(", ")}
          </span>
        )}
      </aside>
    </div>
  )
}, "CreateItem")

const titles: Record<AtomState<typeof storeState.searchParamTarget>, string> = {
  "create": "Создание товара",
  "edit": "Редактирование товара",
  "view": "Просмотр товаров"
}

const headerTitleAtom = atom((ctx) =>
  titles[ctx.spy(storeState.searchParamTarget)], "headerTitle"
)

const StoreItem = reatomComponent<StoreItemProps>(({ ctx, imageUrl, description, title, id, ...base }) => {
  const item = { imageUrl, description, title, id, ...base }

  return (
    <div
      className="
        flex items-center border border-neutral-800 gap-2 sm:gap-4 justify-between
        px-2 sm:px-4 py-2 w-full h-18 rounded-lg
      "
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <img src={imageUrl} alt="" className="hidden sm:block object-cover min-h-10 min-w-10 h-10 w-10" />
        <div className="flex flex-col min-w-0 w-full">
          <Typography className="text-nowrap truncate ">
            {title}
          </Typography>
          <Typography className='text-neutral-400 text-sm text-nowrap truncate'>
            {description}
          </Typography>
        </div>
      </div>
      <div className="flex items-center gap-2 h-full w-fit">
        <div className="flex items-center border border-neutral-800 p-1 rounded-lg gap-1">
          <LinkButton
            link={createLink("store", id)}
          />
          <EditButton
            onClick={() => navigate(`/private/store?target=edit&id=${id}`)}
          />
          <Button
            className="p-0! h-6! w-6! aspect-square bg-neutral-800 hover:bg-neutral-700"
            title="Дублировать"
            onClick={() => duplicateStoreItem(ctx, id)}
          >
            <Icon name="sprite:copy" className="size-4" />
          </Button>
          <DeleteButton
            onClick={() => deleteStoreItem.before(ctx, item)}
          />
        </div>
      </div>
    </div>
  )
}, "StoreItem")

const StoreItemsSkeleton = () => Array.from({ length: 12 }).map((_, idx) =>
  <Skeleton key={idx} className="h-18 w-full" />)

const StoreItems = reatomComponent(({ ctx }) => {
  useUpdate(storeItems.fetch, []);

  if (ctx.spy(storeItems.fetch.statusesAtom).isFirstPending) {
    return <StoreItemsSkeleton />
  }

  const error = ctx.spy(storeItems.fetch.errorAtom)
  if (error) return <ErrorBlock title={error.message} />

  const data = ctx.spy(storeItems.fetch.dataAtom)?.data;
  if (!data) return null;

  return (
    <div className="flex flex-col gap-2 w-full h-full">
      {data.map((item) => <StoreItem key={item.id} {...item} />)}
    </div>
  )
}, "StoreItems")

const Wrapper = reatomComponent<PropsWithChildren>(({ ctx, children }) => {
  const isLoading =
    ctx.spy(deleteStoreItem.submit.statusesAtom).isPending ||
    ctx.spy(editStoreItem.submit.statusesAtom).isPending ||
    ctx.spy(createStoreItem.submit.statusesAtom).isPending;

  return (
    <SectionWrapper
      data-state={isLoading ? "loading" : "idle"}
      className="flex flex-col gap-4 w-full h-full
        data-[state=loading]:pointer-events-none data-[state=loading]:opacity-60 data-[state=idle]:pointer-events-auto"
    >
      {children}
    </SectionWrapper>
  )
}, "Wrapper")

const EditItem = reatomComponent(({ ctx }) => {
  const data = ctx.spy(itemToEditAtom);

  const editor = useEditor({
    extensions: editorExtensions,
    onUpdate: ({ editor }) => {
      editStoreItemState.content(ctx, editor.getJSON())
    }
  })

  useUpdate((ctx) => {
    if (!data) return;

    editStoreItem.load(ctx, data);
    editor.commands.setContent(normalizeTiptapContent(data.content))
  }, [data?.id, editor])

  if (ctx.spy(storeItems.fetch.statusesAtom).isPending) {
    return <Skeleton className="h-24 w-full" />
  }

  if (!data) {
    return <Typography>Товар не найден</Typography>;
  }

  const currencyCollection = createListCollection({ items: CURRENCY_ITEMS(ctx) })
  const typeCollection = createListCollection({ items: TYPE_ITEMS })
  const typeTitle = TYPE_ITEMS.find((item) => item.value === ctx.spy(editStoreItemState.type))?.title ?? ""

  return (
    <div className="flex flex-col gap-3 w-full h-full">
      <Typography className="text-2xl font-semibold">
        {ctx.spy(editStoreItemState.title)}
      </Typography>
      <div className="flex overflow-hidden h-40">
        <img
          src={ctx.spy(editStoreItemState.imageUrl)}
          alt=""
          draggable={false}
          className="object-cover w-auto h-full"
        />
      </div>
      <Input
        value={ctx.spy(editStoreItemState.title)}
        onChange={e => editStoreItemState.title(ctx, e.target.value)}
        placeholder="Заголовок"
      />
      <Input
        value={ctx.spy(editStoreItemState.value)}
        onChange={e => editStoreItemState.value(ctx, e.target.value)}
        placeholder="Значение"
      />
      <Input
        value={ctx.spy(editStoreItemState.command)}
        onChange={e => editStoreItemState.command(ctx, e.target.value)}
        placeholder="Команда для выдачи"
      />
      <Input
        value={ctx.spy(editStoreItemState.refundCmd) ?? ""}
        onChange={e => editStoreItemState.refundCmd(ctx, e.target.value || null)}
        placeholder="Команда для возврата (необязательно)"
      />
      <div className="flex items-center gap-2 w-full">
        <Input
          value={ctx.spy(editStoreItemState.price)}
          onChange={e => editStoreItemState.price(ctx, e.target.value)}
          placeholder="Цена"
          type="number"
          className="bg-transparent border border-neutral-800 text-sm h-8 w-fit"
        />
        <Select.Root
          collection={currencyCollection}
          value={[ctx.spy(editStoreItemState.currency)]}
          onValueChange={({ value }) => editStoreItemState.currency(ctx, value[0])}
          className="flex flex-col gap-1 w-full"
        >
          <Select.Control className={selectVariant.control()}>
            <Select.Trigger className={selectVariant.trigger()}>
              <Select.ValueText className="border border-neutral-800 h-8 px-4">
                {getCurrencyTitle(ctx, ctx.spy(editStoreItemState.currency))}
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
                  {CURRENCY_ITEMS(ctx).map((item) => (
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
        <Select.Root
          collection={typeCollection}
          value={[ctx.spy(editStoreItemState.type)]}
          onValueChange={({ value }) => editStoreItemState.type(ctx, value[0])}
          className="flex flex-col gap-1 w-full"
        >
          <Select.Control className={selectVariant.control()}>
            <Select.Trigger className={selectVariant.trigger()}>
              <Select.ValueText className="border border-neutral-800 h-8 px-4">
                {typeTitle}
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
                  {TYPE_ITEMS.map((item) => (
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
      </div>
      <div className="flex flex-col gap-4 rounded-lg border border-neutral-800 w-full p-2">
        <EditorMenuBar editor={editor} />
        <EditorContent editor={editor} />
      </div>
      <Button
        onClick={() => editStoreItem.submit(ctx, data.id)}
        disabled={ctx.spy(editStoreItem.submit.statusesAtom).isPending}
        className="bg-neutral-50 text-neutral-950 font-semibold text-lg self-end"
      >
        Применить
      </Button>
    </div>
  )
}, "EditItem")

const COMPONENTS: Record<string, ReactNode> = {
  "create": <CreateItem />,
  "view": <StoreItems />,
  "edit": <EditItem />
}

const StoreHeader = reatomComponent(({ ctx }) => {
  const title = ctx.spy(headerTitleAtom);
  const styles = sectionActionVariant({ state: "default" })

  return (
    <div className="flex items-center justify-between gap-1 w-full">
      <div className="flex gap-1 items-center justify-start w-full">
        <Typography className='text-base font-semibold'>
          {title}
        </Typography>
      </div>
      <Button
        onClick={() => navigate("/private/store?target=create")}
        className={styles.root()}
      >
        <Typography className={styles.label()}>Создать</Typography>
        <Icon name="sprite:plus" className={styles.icon()} />
      </Button>
    </div>
  )
}, "Header")

const Components = reatomComponent(({ ctx }) => COMPONENTS[ctx.spy(storeState.searchParamTarget)], "Components")

export const StorePrivated = () => {
  return (
    <Wrapper>
      <StoreHeader />
      <Components />
    </Wrapper>
  )
}
