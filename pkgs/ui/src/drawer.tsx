import { Drawer as ArkDrawer } from "@ark-ui/react/drawer";
import { Portal } from "@ark-ui/react/portal";
import type { ComponentProps, PropsWithChildren, ReactNode } from "react";
import { cn } from "./cn";

export type DrawerSide = "bottom" | "left" | "right";

const POSITIONER: Record<DrawerSide, string> = {
	bottom: "items-end justify-center",
	left: "items-stretch justify-start",
	right: "items-stretch justify-end",
};

const SHAPE: Record<DrawerSide, string> = {
	bottom: "max-h-[80dvh] w-full rounded-t-lg border-t",
	left: "h-full w-3/4 rounded-r-lg border-r",
	right: "h-full w-3/4 rounded-l-lg border-l",
};

type DrawerRootProps = PropsWithChildren<{
	open: boolean;
	onOpenChange: (open: boolean) => void;
}>;

/**
 * Bottom sheet shell shared by the Fasberry apps: the same geometry, backdrop and
 * grabber as the minotaur drawer. Colours come from the app through `className`,
 * so it works with the neutral palette and with the fumadocs tokens.
 */
export function DrawerRoot({ open, onOpenChange, children }: DrawerRootProps) {
	return (
		<ArkDrawer.Root open={open} onOpenChange={({ open: next }) => onOpenChange(next)} lazyMount unmountOnExit>
			{children}
		</ArkDrawer.Root>
	);
}

type DrawerTriggerProps = PropsWithChildren<{
	asChild?: boolean;
	className?: string;
}>;

export function DrawerTrigger({ children, asChild, className }: DrawerTriggerProps) {
	return (
		<ArkDrawer.Trigger asChild={asChild} className={className}>
			{children}
		</ArkDrawer.Trigger>
	);
}

type DrawerContentProps = PropsWithChildren<
	Omit<ComponentProps<typeof ArkDrawer.Content>, "children"> & {
		side?: DrawerSide;
	}
>;

export function DrawerContent({ side = "bottom", className, children, ...props }: DrawerContentProps) {
	return (
		<Portal>
			<ArkDrawer.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
			<ArkDrawer.Positioner className={cn("fixed inset-0 z-50 flex", POSITIONER[side])}>
				<ArkDrawer.Content
					className={cn(
						`pointer-events-auto relative flex h-fit flex-col gap-4 p-2
            text-start outline-none`,
						SHAPE[side],
						className,
					)}
					{...props}
				>
					<ArkDrawer.Grabber className="mx-auto -my-2 flex h-10 w-full shrink-0 cursor-grab items-center justify-center active:cursor-grabbing">
						<ArkDrawer.GrabberIndicator className="h-1 w-9 rounded-sm bg-neutral-600" />
					</ArkDrawer.Grabber>
					{children}
				</ArkDrawer.Content>
			</ArkDrawer.Positioner>
		</Portal>
	);
}

type DrawerHeaderProps = {
	title: string;
	description?: string;
	actions?: ReactNode;
};

export function DrawerHeader({ title, description, actions }: DrawerHeaderProps) {
	return (
		<div className="flex w-full items-start gap-2">
			<div className="flex min-w-0 flex-col gap-1">
				<ArkDrawer.Title className="w-full text-left text-2xl font-semibold leading-6">{title}</ArkDrawer.Title>
				<ArkDrawer.Description className="hidden">{description}</ArkDrawer.Description>
			</div>
			{actions ? <div className="ms-auto shrink-0">{actions}</div> : null}
		</div>
	);
}

export { ArkDrawer as DrawerPrimitives };
