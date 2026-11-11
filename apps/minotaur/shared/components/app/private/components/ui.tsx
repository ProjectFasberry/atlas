import { Link } from "@/shared/components/config/link/link"
import { Button } from "@/shared/ui/button"
import { tv, type VariantProps } from "tailwind-variants"
import { Typography } from "@/shared/ui/typography"
import type { IconName } from "@/shared/ui/icon"
import { Icon } from "@/shared/ui/icon"
import { reatomComponent } from "@reatom/npm-react";
import { type ActionParent, type ActionType, actions, getIsSelectedActionAtom } from "../models/actions.model";
import type { ComponentPropsWithoutRef, HTMLAttributes } from "react";
import { clsx } from "cnfast"

type ButtonProps = ComponentPropsWithoutRef<"button">

const buttonVariant = tv({
  base: `p-0! h-6! rounded-lg!`,
  variants: {
    type: {
      icon: "w-6! aspect-square bg-neutral-800 hover:bg-neutral-700",
      action: "min-w-6!"
    },
    variant: {
      default: "",
      danger: "hover:bg-red/70",
      selected: "bg-neutral-50 text-neutral-950"
    }
  },
  compoundVariants: [
    { type: "action", variant: "default", class: "bg-neutral-800 text-neutral-50" }
  ],
  defaultVariants: {
    type: "icon"
  }
})

export const DeleteButton = ({ className, ...props }: ButtonProps) => {
  return (
    <Button className={buttonVariant({ variant: "danger", className })} {...props}>
      <Icon name="sprite:trash" className="size-4" />
    </Button>
  )
}
export const EditButton = ({ className, ...props }: ButtonProps) => {
  return (
    <Button className={buttonVariant({ className })} {...props}>
      <Icon name="sprite:pencil" className="size-4" />
    </Button>
  )
}
export const LinkButton = ({ link }: { link: string }) => {
  return (
    <Link
      href={link}
      target="_blank"
      className={buttonVariant({ className: "flex items-center justify-center rounded-xl" })}
    >
      <Icon name="sprite:arrow-right" className="size-4 -rotate-45" />
    </Link>
  )
}
export const AddButton = ({ className, ...props }: ButtonProps) => {
  return (
    <Button className={buttonVariant({ className })} {...props}>
      <Icon name="sprite:plus" className="size-4" />
    </Button >
  )
}

type ActionButtonProps = ButtonProps & Pick<VariantProps<typeof buttonVariant>, "variant"> & {
  icon: IconName
}

export const ActionButton = ({ variant, className, children, icon: iconName, ...props }: ActionButtonProps) => {
  return (
    <Button className={buttonVariant({ type: "action", variant, className })} {...props}>
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

export const sectionActionVariant = tv({
  slots: {
    root: "h-6 min-w-6 gap-2",
    label: "text-sm font-semibold",
    icon: "size-4"
  },
  variants: {
    state: {
      default: {
        root: "bg-neutral-800 text-neutral-50 px-3"
      },
      selected: {
        root: "bg-neutral-50 text-neutral-950 p-0"
      }
    }
  },
  defaultVariants: {
    state: "default"
  }
})

export type SectionActionProps = {
  parent: ActionParent
  type: ActionType
  title?: string
  icon?: { idle: IconName, active: IconName }
  className?: string
}

export const SectionAction = reatomComponent<SectionActionProps>(({
  ctx, parent, type, title, className,
  icon = { idle: "sprite:plus", active: "sprite:x" }
}) => {
  const isSelected = ctx.spy(getIsSelectedActionAtom(parent, type))
  const styles = sectionActionVariant({ state: isSelected ? "selected" : "default" })

  const handle = () => {
    if (isSelected) {
      actions.goBack(ctx)
    } else {
      actions.open(ctx, { parent, type })
    }
  }

  return (
    <Button
      onClick={handle}
      aria-pressed={isSelected}
      className={styles.root({ className })}
    >
      {!isSelected && title && (
        <Typography className={styles.label()}>
          {title}
        </Typography>
      )}
      <Icon name={isSelected ? icon.active : icon.idle} className={styles.icon()} />
    </Button>
  )
}, "SectionAction")

export const ButtonXSubmit = ({
  className, ...props
}: Pick<ComponentPropsWithoutRef<"button">, "className" | "onClick" | "disabled">) => {
  return (
    <Button background="white" className={clsx("gap-2 h-6 w-6 p-0", className)} {...props}>
      <Icon name="sprite:check" className="size-4" />
    </Button>
  )
}
