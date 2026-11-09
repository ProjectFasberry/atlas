import type { AtomMut } from "@reatom/framework"
import { reatomComponent } from "@reatom/npm-react"
import type { PropsWithChildren } from "react"
import { tv } from "tailwind-variants"
import { Drawer } from "@ark-ui/react/drawer"
import { Portal } from "@ark-ui/react/portal"

const vaulVariants = tv({
  base: `relative h-fit flex flex-col gap-4 bg-neutral-900 p-2 border-neutral-700/60
    pointer-events-auto after:absolute after:inset-x-0 after:top-full after:h-[200%]
    after:bg-neutral-900 after:content-['']`,
  variants: {
    side: {
      bottom: "w-full max-h-3/4 rounded-t-xl border-t",
      left: "h-full w-3/4 rounded-r-xl border-r",
      right: "h-full w-3/4 rounded-l-xl border-l"
    }
  },
  defaultVariants: {
    side: "bottom"
  }
})

const positionerVariants = tv({
  base: "fixed inset-0 z-50 flex",
  variants: {
    side: {
      bottom: "items-end justify-center",
      left: "items-stretch justify-start",
      right: "items-stretch justify-end"
    }
  },
  defaultVariants: {
    side: "bottom"
  }
})

type VaulContentProps = PropsWithChildren & {
  side?: "left" | "right" | "bottom",
  className?: string,
}

const VaulTrigger = ({ children, asChild, className }: PropsWithChildren & { asChild?: boolean, className?: string }) => {
  return (
    <Drawer.Trigger asChild={asChild} className={className}>{children}</Drawer.Trigger>
  )
}

type VaulHeaderProps = {
  title: string,
  description?: string,
}

const VaulHeader = ({
  title, description
}: VaulHeaderProps) => {
  return (
    <>
      <Drawer.Title className="text-2xl w-full text-left font-semibold text-neutral-50 leading-6">
        {title}
      </Drawer.Title>
      <Drawer.Description className="hidden">
        {description}
      </Drawer.Description>
    </>
  )
}

const Vaul = reatomComponent<PropsWithChildren & { openAtom: AtomMut<boolean> }>(({ ctx, children, openAtom }) => {
  const open = ctx.spy(openAtom)

  return (
    <Drawer.Root
      open={open}
      onOpenChange={({ open: next }) => openAtom(ctx, next)}
      lazyMount
      unmountOnExit
    >
      {children}
    </Drawer.Root>
  )
}, "Vaul")

const VaulContent = ({
  side = "bottom", className, children
}: VaulContentProps) => {
  return (
    <Portal>
      <Drawer.Backdrop className="fixed inset-0 z-50 bg-black/30 backdrop-blur" />
      <Drawer.Positioner className={positionerVariants({ side })}>
        <Drawer.Content className={vaulVariants({ side, className })}>
          <Drawer.Grabber className="mx-auto -my-2 flex h-10 w-full shrink-0 cursor-grab items-center justify-center active:cursor-grabbing">
            <Drawer.GrabberIndicator className="h-1 w-9 rounded-sm bg-neutral-600" />
          </Drawer.Grabber>
          {children}
        </Drawer.Content>
      </Drawer.Positioner>
    </Portal>
  )
}

export {
  Vaul,
  VaulTrigger,
  VaulContent,
  VaulHeader,
  vaulVariants
}
