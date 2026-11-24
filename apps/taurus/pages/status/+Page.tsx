import { MainWrapperPage } from "@/shared/ui/main-wrapper";
import { ServerStatus } from "./(components)/server-status";
import { StatusOverview } from "./(components)/status-overview";

export default function Page() {
  return (
    <MainWrapperPage variant="with_section">
      <div class="full-screen-section min-h-screen flex items-center justify-center py-32">
        <div class="flex h-full flex-col lg:flex-row justify-start overflow-hidden items-start gap-6 responsive">
          <iframe
            src="https://discord.com/widget?id=958086036393689098&theme=dark"
            width="350"
            height="500"
            // @ts-ignore
            allowtransparency={true.toString()}
            className="rounded-sm! border-2 border-[#454545] w-full lg:w-1/4"
            sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
          />
          <div class="flex flex-col w-full gap-6 lg:w-3/4 h-full">
            <StatusOverview />
            <div
              class="flex flex-col max-h-124 overflow-y-scroll gap-6 card-wrapper w-full h-full"
            >
              <ServerStatus />
            </div>
          </div>
        </div>
      </div>
    </MainWrapperPage>
  )
}
