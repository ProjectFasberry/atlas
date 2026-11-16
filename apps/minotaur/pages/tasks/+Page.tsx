import { Typography } from "@/shared/ui/typography"
import { Tasks, TasksFilter } from "@/shared/components/app/tasks/components/tasks"
import { translate } from "@/shared/locales/helpers"

export default function Page() {
  return (
    <div className="flex flex-col w-full h-full gap-6">
      <Typography className="text-3xl font-semibold">
        {translate["tasks.heading"]()}
      </Typography>
      <div className="flex flex-col gap-4 h-full w-full">
        <div className="flex flex-col gap-4 w-full h-full">
          <TasksFilter />
          <Tasks />
        </div>
      </div>
    </div>
  )
}
