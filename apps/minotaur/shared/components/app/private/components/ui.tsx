import { Link } from "@/shared/components/config/link/link"
import { Button } from "@/shared/ui/button"
import { type HTMLAttributes, type ReactNode } from "react"
import { tv, type VariantProps } from "tailwind-variants"
import { Typography } from "@/shared/ui/typography"
import type { IconName } from "@/shared/ui/icon"
import { Icon } from "@/shared/ui/icon"
import { reatomComponent } from "@reatom/npm-react";
import { type ActionParent, type ActionType, actions, getIsSelectedActionAtom } from "../models/actions.model";
import type { ComponentPropsWithoutRef } from "react";
import { clsx } from "cnfast"

type ButtonProps = ComponentPropsWithoutRef<"button">

const baseVariant = tv({
  base: `h-6 w-6 aspect-square p-0`,
  variants: {
    variant: {
      default: "bg-neutral-800",
      danger: "bg-neutral-800 hover:bg-red/70"
    }
  },
  defaultVariants: {
    variant: "default"
  }
})

export const DeleteButton = ({ className, ...props }: ButtonProps) => {
  return (
    <Button className={baseVariant({ variant: "danger", className })} {...props}>
      <Icon name="sprite:trash" className="size-4" />
    </Button>
  )
}
export const EditButton = ({ className, ...props }: ButtonProps) => {
  return (
    <Button className={baseVariant({ className })} {...props}>
      <Icon name="sprite:pencil" className="size-4" />
    </Button>
  )
}
export const LinkButton = ({ link }: { link: string }) => {
  return (
    <Link
      href={link}
      target="_blank"
      className={baseVariant({ className: "flex items-center justify-center rounded-xl" })}
    >
      <Icon name="sprite:arrow-right" className="size-4 -rotate-45" />
    </Link>
  )
}
export const AddButton = ({ className, ...props }: ButtonProps) => {
  return (
    <Button className={baseVariant({ className })} {...props}>
      <Icon name="sprite:plus" className="size-4" />
    </Button >
  )
}

const actionButtonVariant = tv({
  base: `p-0 h-6 min-w-6`,
  variants: {
    variant: {
      default: "bg-neutral-800 text-neutral-50",
      selected: "bg-neutral-50 text-neutral-950"
    }
  }
})

type ActionButtonProps = ButtonProps & VariantProps<typeof actionButtonVariant> & {
  icon: IconName
}

export const ActionButton = ({ variant, className, children, icon: iconName, ...props }: ActionButtonProps) => {
  return (
    <Button className={actionButtonVariant({ variant, className })} {...props}>
      {children && (
        <div className="px-2">
          {children}
        </div>
      )}
      <Icon name={iconName} className="size-4" />
    </Button>
  )
}

export const itemVariant = tv({
  base: `flex items-center justify-start h-8 border text-neutral-50 rounded-lg px-4 cursor-pointer`,
  variants: {
    variant: {
      default: "border-neutral-800",
      selected: "border-green-800"
    }
  },
  defaultVariants: {
    variant: "default"
  }
})

export const WithHeader = ({ title, children }: Pick<ButtonProps, "title" | "children">) => {
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2 h-8">
        <Typography className="text-base font-semibold">
          {title}
        </Typography>
      </div>
      {children}
    </div>
  )
}

export const SectionWrapper = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => {
  return <div className={clsx(`p-2 bg-neutral-900 rounded-xl sm:p-3`, className)} {...props} />
}

export const ToActionButtonX = reatomComponent<{
  parent: string, type: string, title?: string
}>(({
  ctx, parent, type, title
}) => {
  const isSelected = ctx.spy(getIsSelectedActionAtom(parent as ActionParent, type as ActionType));

  const handle = () => {
    if (isSelected) {
      actions.goBack(ctx)
    } else {
      actions.createLink(ctx, { parent: parent as ActionParent, type: type as ActionType })
    }
  }

  return (
    <Button
      onClick={handle}
      data-state={isSelected ? "selected" : "default"}
      className="
        h-6 min-w-6 gap-2
        data-[state=selected]:text-neutral-950 data-[state=selected]:bg-neutral-50 data-[state=selected]:p-0
        data-[state=default]:text-neutral-50 data-[state=default]:bg-neutral-800 data-[state=default]:px-3
      "
    >
      {isSelected ? null : (
        <Typography className="text-sm font-semibold">
          {title}
        </Typography>
      )}
      <Icon name={isSelected ? "sprite:x" : "sprite:plus"} className="size-4" />
    </Button>
  )
}, "ToActionButtonX")

export const ButtonXSubmit = ({
  className, ...props
}: Pick<ComponentPropsWithoutRef<"button">, "className" | "onClick" | "disabled">) => {
  return (
    <Button background="white" className={clsx("gap-2 h-6 w-6 p-0", className)} {...props}>
      <Icon name="sprite:check" className="size-4" />
    </Button>
  )
}
