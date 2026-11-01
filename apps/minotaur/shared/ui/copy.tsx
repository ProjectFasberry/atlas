import { Icon } from "@/shared/ui/icon"
import { useState } from "react";
import { Button, type ButtonProps } from "./button";
import { clsx } from "cnfast";
import { toast } from "sonner";

const CopyButton = ({ content }: { content: string }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="absolute right-1 *:size-3 top-1 p-1 hover:bg-neutral-600 rounded-sm bg-neutral-700 transition-colors"
      aria-label="Копировать"
    >
      {isCopied
        ? <Icon name="sprite:check" className="text-green-400" />
        : <Icon name="sprite:copy" />
      }
    </button>
  )
}

type CopyProps =
  | { as: "value"; code: string }
  | ({ as: "button"; code?: never } & ButtonProps);

export const Copy = (props: CopyProps) => {
  if (!props.as || props.as === "value") {
    const { code } = props;

    return (
      <div className="relative overflow-hidden">
        <CopyButton content={code} />
        <pre className="pr-10">
          <code>{code}</code>
        </pre>
      </div>
    );
  }

  if (props.as === "button") {
    const { code, onClick, className, ...buttonProps } = props;

    const wrapOnClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      toast.success("Содержимое скопировано");
      onClick?.(e);
    }

    return (
      <Button background="default" className={clsx("text-sm font-semibold", className)} onClick={wrapOnClick} {...buttonProps}>
        Скопировать
      </Button>
    )
  }

  return null;
}
