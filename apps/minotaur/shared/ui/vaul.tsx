import type { AtomMut } from "@reatom/framework"
import { reatomComponent } from "@reatom/npm-react"
import type { PropsWithChildren } from "react"
import {
	DrawerContent, DrawerHeader, DrawerRoot, DrawerTrigger, type DrawerSide
} from "@repo/ui"

type VaulContentProps = PropsWithChildren & {
	side?: DrawerSide,
	className?: string,
}

export const VaulTrigger = DrawerTrigger
export const VaulHeader = DrawerHeader

export const VaulContent = ({
	side = "bottom", className, children
}: VaulContentProps) => {
	return (
		<DrawerContent
			side={side}
			className={[
				`bg-neutral-900 border-neutral-700/60 text-neutral-50
				after:absolute after:inset-x-0 after:top-full after:h-[200%]
				after:bg-neutral-900 after:content-['']`,
				className,
			].filter(Boolean).join(" ")}
		>
			{children}
		</DrawerContent>
	)
}

export const Vaul = reatomComponent<PropsWithChildren & { openAtom: AtomMut<boolean> }>(
	({ ctx, children, openAtom }) => {
		const open = ctx.spy(openAtom)

		return (
			<DrawerRoot open={open} onOpenChange={(next) => openAtom(ctx, next)}>
				{children}
			</DrawerRoot>
		)
	}, "Vaul")
