import { reatomComponent, useUpdate } from "@reatom/npm-react"
import { usersState } from "../../models/users.model"
import { UsersManagement } from "./users-management"
import { UsersFilters, UsersFiltersViewer } from "./users.filters"

const UsersFiltersScrollTop = reatomComponent(({ ctx }) => {
  const search = ctx.spy(usersState.filters.searchQuery)
  const sort = ctx.spy(usersState.filters.sortBy)
  const asc = ctx.spy(usersState.filters.asc)

  useUpdate(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }, [search, sort, asc])

  return null
}, "UsersFiltersScrollTop")

export const UsersHeader = () => {
  return (
    <>
      <UsersFiltersScrollTop />
      <UsersFiltersViewer />
      <UsersFilters />
      <UsersManagement />
    </>
  )
}
