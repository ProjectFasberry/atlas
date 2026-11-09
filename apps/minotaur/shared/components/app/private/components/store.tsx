import { DeleteButton, EditButton, SectionWrapper, LinkButton } from "@/shared/components/app/private/components/ui"
import {
  itemToEditAtom, editStoreItem, editStoreItemState, deleteStoreItem,
  storeState, storeItems, createStoreItem, createStoreItemState
} from "@/shared/components/app/private/models/store.model"
import { EditorMenuBar } from "@/shared/components/config/editor/editor"
import { atom, type AtomState, type Ctx } from "@reatom/framework"
import { reatomComponent, useUpdate } from "@reatom/npm-react"
import { Button } from "@/shared/ui/button"
import { Skeleton } from "@/shared/ui/skeleton"
import { Typography } from "@/shared/ui/typography"
import { Icon } from "@/shared/ui/icon"
import { type PropsWithChildren, type ReactNode } from "react"
import { navigate } from "vike/client/router"
import { EditorContent, useEditor, type JSONContent } from "@tiptap/react"
import { belkoinImage, charismImage } from "@/shared/consts/images"
import { getFromDictionary } from "@/shared/models/app/utils"
import { type StoreItem as StoreItemProps } from "../../shop/models/store-item.model"
import { editorExtensions } from "@/shared/components/config/editor/editor.model"
import { ErrorBlock } from "@/shared/ui/error-block"
import { Input } from "@/shared/ui/input";
import { Portal } from '@ark-ui/react/portal'
import { Select, createListCollection } from '@ark-ui/react/select'
import { selectContentBaseStyle, selectVariant } from "@/shared/ui/select"
import { createLink } from "@/shared/components/config/link/link.model"

const currencyValues = ["CHARISM", "BELKOIN"];
const getCurrencyTitle = (ctx: Ctx, value: string) => getFromDictionary(ctx, value)

const CURRENCY_ITEMS = (ctx: Ctx) => currencyValues.map((value) => ({
  value,
  title: getCurrencyTitle(ctx, value)!,
}));

const TYPE_ITEMS = [
  { title: "Ивент", value: "event" },
  { title: "Донат", value: "donate" }
]

export const CreateItem = reatomComponent(({ ctx }) => {
  const editor = useEditor({
    extensions: editorExtensions,
    onUpdate: ({ editor }) => {
      createStoreItemState.content(ctx, editor.getJSON())
    }
  })

  const items = CURRENCY_ITEMS(ctx)

  const collectionf = createListCollection({
    items: items,
  })

  const collectionss = createListCollection({
    items: TYPE_ITEMS,
  })

  return (
    <div className="flex flex-col gap-2 w-full h-full">
      <Input
        value={ctx.spy(createStoreItemState.title)}
        onChange={e => createStoreItemState.title(ctx, e.target.value)}
        placeholder="Заголовок"
      />
      <Input
        value={ctx.spy(createStoreItemState.value) ?? ""}
        onChange={e => createStoreItemState.value(ctx, e.target.value)}
        placeholder="Значение"
      />
      <Input
        value={ctx.spy(createStoreItemState.command) ?? ""}
        onChange={e => createStoreItemState.command(ctx, e.target.value)}
        placeholder="Команда для выдачи"
      />
      <Input
        value={ctx.spy(createStoreItemState.refundCmd) ?? ""}
        onChange={e => createStoreItemState.refundCmd(ctx, e.target.value)}
        placeholder="Команда для возврата (необязательно)"
      />
      <Input
        type="file"
        onChange={e => {
          if (!e.target.files) return;
          const file = e.target.files[0]

          createStoreItemState.imgUrl(ctx, URL.createObjectURL(file))
        }}
      />
      <div className="flex items-center gap-2 w-full">
        <Input
          value={ctx.spy(createStoreItemState.price) ?? ""}
          onChange={e => createStoreItemState.price(ctx, e.target.value)}
          placeholder="Цена"
          type="number"
          className="bg-transparent border border-neutral-800 text-sm h-8 w-fit"
        />
        <Select.Root
          collection={collectionf}
          onValueChange={({ value }) => createStoreItemState.currency(ctx, value[0] as AtomState<typeof createStoreItemState.currency>)}
          className="flex flex-col gap-1 w-full"
        >
          <Select.Control className={selectVariant.control()}>
            <Select.Trigger className={selectVariant.trigger()}>
              <Select.ValueText className="border border-neutral-800 h-8 px-4">
                {getCurrencyTitle(ctx, ctx.spy(createStoreItemState.currency))}
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
                  {items.map((item) => (
                    <Select.Item key={item.value} item={item} className={selectVariant.item()}>
                      <Select.ItemText className={selectVariant.itemText()}>
                        {item.title}
                      </Select.ItemText>
                      <Select.ItemIndicator className={selectVariant.itemIndicator()}>
                        <Icon name="sprite:check" className="size-4"/>
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
          collection={collectionss}
          onValueChange={({ value }) => createStoreItemState.type(ctx, value[0] as AtomState<typeof createStoreItemState.type>)}
          className="flex flex-col gap-1 w-full"
        >
          <Select.Control className={selectVariant.control()}>
            <Select.Trigger className={selectVariant.trigger()}>
              <Select.ValueText className="border border-neutral-800 h-8 px-4">
                {TYPE_ITEMS.find((item) => item.value === ctx.spy(createStoreItemState.type))?.title ?? ""}
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
                        <Icon name="sprite:check" className="size-4"/>
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
      <div className="flex flex-col">
        <EditorMenuBar editor={editor} />
        <EditorContent editor={editor} />
      </div>
      <div className="flex items-center justify-end w-full">
        <Button
          className="h-10 w-fit items-center gap-2 justify-center px-4 bg-neutral-800"
          onClick={() => createStoreItem.submit(ctx)}
          disabled={ctx.spy(createStoreItem.submit.statusesAtom).isPending}
        >
          <Typography className="font-semibold text-lg text-neutral-50">
            Создать
          </Typography>
          <Icon name="sprite:check" className="size-[18px]" />
        </Button>
      </div>
    </div>
  )
}, "CreateItem")

const titles: Record<AtomState<typeof storeState.searchParamTarget>, string> = {
  "create": "Создание товара",
  "edit": "Редактирование товара",
  "view": "Просмотр товаров"
}

const headerTitleAtom = atom((ctx) => titles[ctx.spy(storeState.searchParamTarget)], "headerTitle")
const backIsVisibleAtom = atom((ctx) => !!ctx.spy(storeState.searchParamTarget), "backIsVisible")

const StoreItem = reatomComponent<StoreItemProps>(({ ctx, imageUrl, description, title, id, ...base }) => {
  const item = { imageUrl, description, title, id, ...base }

  return (
    <div className="flex items-center border border-neutral-800 gap-2 sm:gap-4 justify-between px-2 sm:px-4 py-2 w-full h-18 rounded-lg">
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
          <DeleteButton
            onClick={() => deleteStoreItem.before(ctx, item)}
          />
        </div>
      </div>
    </div>
  )
}, "StoreItem")

const StoreCreateItem = () => {
  return (
    <Button
      className="h-8 w-fit items-center gap-2 justify-center px-4 border border-neutral-800"
      onClick={() => navigate("/private/store?target=create")}
    >
      <Typography className="font-semibold text-lg text-neutral-50">
        Создать
      </Typography>
      <Icon name="sprite:plus" className="size-[18px]" />
    </Button>
  )
}

const StoreItemsSkeleton = () => Array.from({ length: 12 }).map((_, idx) => <Skeleton key={idx} className="h-18 w-full" />)

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

const CURRENCY_IMAGE: Record<string, string> = {
  "CHARISM": charismImage,
  "BELKOIN": belkoinImage
}

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
    editor.commands.setContent((data.content ?? {}) as JSONContent)
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
                        <Icon name="sprite:check" className="size-4"/>
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
                        <Icon name="sprite:check" className="size-4"/>
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
        Применить изменения
      </Button>
    </div>
  )
}, "EditItem")

const COMPONENTS: Record<string, ReactNode> = {
  "create": <CreateItem />,
  "view": <StoreItems />,
  "edit": <EditItem />
}

const Back = reatomComponent(({ ctx }) => {
  const isVisible = ctx.spy(backIsVisibleAtom)
  if (!isVisible) return null;

  return (
    <Button
      className="p-0 h-8 w-8 aspect-square bg-neutral-800"
      onClick={() => window.history.back()}
    >
      <Icon name="sprite:arrow-left" className="size-4" />
    </Button>
  )
}, "Back")

const StoreHeader = reatomComponent(({ ctx }) => {
  const title = ctx.spy(headerTitleAtom);

  return (
    <div className="flex items-center justify-between gap-1 w-full">
      <div className="flex gap-2 items-center justify-start w-full">
        <Back />
        <Typography className='text-lg font-semibold text-neutral-50'>
          {title}
        </Typography>
      </div>
      <StoreCreateItem />
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
