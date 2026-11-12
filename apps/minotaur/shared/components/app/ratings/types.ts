import { type RatingType } from "./labels";

export type RatingItem = Pick<{ title: string; childs: string[] }, "title"> & {
  childs: { title: string, value: string }[],
  key: string
};

export type RatingsPreferences = {
  server: string,
  type: RatingType,
  asc: boolean
};

export type RatingsPageData = {
  ratingsFilters: RatingsPreferences
};
