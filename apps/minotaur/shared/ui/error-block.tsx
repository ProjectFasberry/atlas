import { Typography } from "@/shared/ui/typography"
import { friendlyError } from "@/shared/lib/errors"

export const ErrorBlock = ({ title, id, raw }: { title: string, id?: string, raw?: boolean }) => {
  return (
    <div
      id={id}
      role="alert"
      aria-live="assertive"
      className="flex bg-red/80 max-w-2xl rounded-lg px-4 py-2 items-center justify-start"
    >
      <Typography className='text-base leading-5 font-semibold'>
        {raw ? title : friendlyError(title)}
      </Typography>
    </div>
  )
}
