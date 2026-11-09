import { UsersViewer } from "../../models/users.model"
import { SectionWrapper } from "../ui"
import { Users, UsersAutoLoad, UsersItemMenu, UsersLoadMoreError } from "./users.list"

export const UsersBody = () => {
  return (
    <SectionWrapper className="flex flex-col">
      <Users />
      <UsersLoadMoreError />
      <UsersAutoLoad />
      <UsersViewer />
      <UsersItemMenu />
    </SectionWrapper>
  )
}
