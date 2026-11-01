import { Button } from "@/shared/ui/button";
import { type PropsWithChildren } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { errorBoundary } from "../models/error.model";
import { Icon } from "@/shared/ui/icon"
import { maybeSpyOptionAtom } from "@/shared/models/app/utils";
import { reatomComponent } from "@reatom/npm-react";
import { Typography } from "@/shared/ui/typography";

const ErrorFallback = reatomComponent<FallbackProps>(({ ctx, error, resetErrorBoundary }) => {
  const stage = maybeSpyOptionAtom(ctx, "state", "stage", "prod")

  return (
    <div className="flex flex-col gap-4 h-dvh responsive mx-auto w-full items-center justify-center">
      <Icon name="sprite:mood-wrrr" className="size-24" />
      <div className="flex flex-col text-center w-full gap-2 items-center justify-center">
        <p className="text-lg sm:text-xl leading-5 font-semibold">
          Произошла ошибка в работе приложения
        </p>
        <Typography color='gray' className="text-sm sm:text-base">
          Мы уже работаем над исправлением!
        </Typography>
      </div>
      <Button
        background='white'
        className="font-semibold"
        onClick={() => resetErrorBoundary()}
      >
        Обновить
      </Button>
      {stage === 'staging' && (
        <div className="flex flex-col mt-2 gap-1 w-full">
          <Typography color='gray' className="text-sm leading-4">
            Debug:
          </Typography>
          <pre className='text-red p-2 text-sm truncate text-wrap'>
            <code>{error.message}</code>
          </pre>
        </div>
      )}
    </div>
  );
}, "ErrorFallback")

export const ErrorBoundaryProvider = ({ children }: PropsWithChildren) => {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(e, info) => errorBoundary.log(e, info)}
    >
      {children}
    </ErrorBoundary >
  )
}
