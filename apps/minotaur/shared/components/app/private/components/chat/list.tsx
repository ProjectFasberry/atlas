import { reatomComponent, useUpdate } from "@reatom/npm-react";
import { chatHistory, chatHistoryState } from "../../models/chat.model";
import { isEmptyArray } from "@/shared/lib/utils";
import { Skeleton } from "@/shared/ui/skeleton";
import { ChatMessage } from "./message";
import { ErrorBlock } from "@/shared/ui/error-block";

const ChatMessagesSkeleton = () => {
  return Array.from({ length: 16 }).map((_, idx) => <Skeleton key={idx} className="h-36 w-full" />)
}

export const ChatMessages = reatomComponent(({ ctx }) => {
  useUpdate(chatHistory.fetch, [])

  if (ctx.spy(chatHistory.fetch.statusesAtom).isFirstPending) {
    return <ChatMessagesSkeleton />
  }

  const error = ctx.spy(chatHistory.fetch.errorAtom);
  if (error) return <ErrorBlock title={error.message} />

  const data = ctx.spy(chatHistoryState.data)
  if (!data || isEmptyArray(data)) return <span>Сообщений нет</span>

  return data.map((item) => <ChatMessage key={item.id} {...item} />)
}, "ChatMessages")
