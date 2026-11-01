import { translate } from "@/shared/locales/helpers"

export default function Page() {
  return (
    <div className='flex flex-col gap-8 w-full h-full'>
      {translate["support.title"]()}
      <span>{translate["support.in-development"]()}</span>
    </div>
  )
}