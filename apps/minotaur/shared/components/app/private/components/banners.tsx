import { reatomComponent, useUpdate } from "@reatom/npm-react"
import { Skeleton } from "@/shared/ui/skeleton"
import { Typography } from "@/shared/ui/typography"
import { ActionButton, DeleteButton } from "./ui"
import { banners, deleteBanner, createBanner, createBannerState, type BannerSingle } from "../models/banner.model"
import { Input } from "@/shared/ui/input"
import { ButtonXSubmit } from "./ui"
import { Dialog } from "@ark-ui/react/dialog"
import { Portal } from "@ark-ui/react/portal"
import { DialogClose, dialogVariant } from "@/shared/ui/dialog"
import { Tooltip } from "@ark-ui/react/tooltip"
import { createPrivatedSectionModel } from "../models/shared.model"
import { menuVariant } from "@/shared/ui/menu"

const fields = [
  { placeholder: "Заголовок", value: createBannerState.title },
  { placeholder: "Описание", value: createBannerState.desc },
  { placeholder: "Заголовок ссылки", value: createBannerState.hrefTitle },
  { placeholder: "Ссылка", value: createBannerState.hrefValue },
]
const CreateBannerSubmit = reatomComponent(({ ctx }) => {
  return (
    <ButtonXSubmit
      onClick={() => createBanner.submit(ctx)}
      disabled={ctx.spy(createBanner.submit.statusesAtom).isPending}
    />
  )
}, "CreateBanner")

const CreateBannerField = reatomComponent<typeof fields[number]>(({ ctx, placeholder, value }) => {
  return (
    <Input
      placeholder={placeholder}
      value={ctx.spy(value)}
      onChange={e => value(ctx, e.target.value)}
    />
  )
}, "CreateBannerField")

const CreateBannerForm = () => {
  return (
    <div className="flex flex-col gap-2">
      {fields.map((item, idx) => <CreateBannerField key={idx} {...item} />)}
    </div>
  )
}

const BannerListItem = reatomComponent<BannerSingle>(({ ctx, id, title, description, href }) => {
  return (
    <div className="flex items-center gap-2 justify-between w-full h-16 border border-neutral-800 p-2 rounded-lg overflow-hidden">
      <div className="flex w-full justify-between sm:items-start gap-1">
        <div className="flex flex-col sm:gap-1 sm:flex-row min-w-0 sm:items-center">
          <div className="flex flex-col">
            <Typography className='truncate font-semibold leading-tight'>
              {title}
            </Typography>
            <Typography>
              {description}
            </Typography>
          </div>
          <Tooltip.Root>
            <Tooltip.Trigger className={menuVariant.trigger()}>
              <Typography color="gray">{href.title}</Typography>
            </Tooltip.Trigger>
            <Portal>
              <Tooltip.Positioner>
                <Tooltip.Content className={menuVariant.content()}>
                  {href.value}
                </Tooltip.Content>
              </Tooltip.Positioner>
            </Portal>
          </Tooltip.Root>
        </div>
        <div className="flex items-center gap-1">
          <Dialog.Root>
            <Dialog.Trigger asChild>
              <ActionButton icon="sprite:eye" variant="default" />
            </Dialog.Trigger>
            <Portal>
              <Dialog.Backdrop className={dialogVariant.backdrop()} />
              <Dialog.Positioner className={dialogVariant.positioner()}>
                <Dialog.Content className={dialogVariant.content("overflow-hidden w-1/3")}>
                  <div className="flex flex-col justify-center w-full h-full items-center">
                    <Typography className='font-semibold'>
                      {title}
                    </Typography>
                    <Typography>
                      {description}
                    </Typography>
                    <a href={href.value} className="text-green-500 text-sm">
                      {href.title}
                    </a>
                  </div>
                  <DialogClose />
                </Dialog.Content>
              </Dialog.Positioner>
            </Portal>
          </Dialog.Root>
          <DeleteButton
            onClick={() => deleteBanner.deleteBefore(ctx, { id, title })}
            disabled={ctx.spy(deleteBanner.submit.statusesAtom).isPending}
          />
        </div>
      </div>
    </div >
  )
}, "BannerListItem")

const BannersListSkeleton = () => (
  <div className="flex flex-col gap-2 w-full h-full">
    {Array.from({ length: 3 }).map((_, idx) => <Skeleton key={idx} className="h-16 w-full" />)}
  </div>
)

const BannersList = reatomComponent(({ ctx }) => {
  useUpdate(banners.fetch, [])

  if (ctx.spy(banners.fetch.statusesAtom).isFirstPending) {
    return <BannersListSkeleton />
  }

  const data = ctx.spy(banners.fetch.dataAtom)?.data;
  if (!data) return null;

  return (
    <div className="flex flex-col gap-2 w-full h-full">
      {data.map(banner => <BannerListItem key={banner.id} {...banner} />)}
    </div>
  )
}, "BannersList")

export const bannersSection = createPrivatedSectionModel({
  event: "banner",
  components: {
    header: {
      create: <CreateBannerSubmit />,
      edit: null
    },
    content: {
      create: <CreateBannerForm />,
      edit: null,
      view:  <BannersList />
    }
  }
})
