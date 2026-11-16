/**
 * Rating payloads come from the generated OpenAPI schema. Each row carries a
 * literal `kind`, so the union can be narrowed without hand-written copies.
 */
type RatingResponse = ExtractApiData<"getServerRatingByBy">["data"]

export type RatingData = RatingResponse extends { data: infer Data } ? Data : never
type RatingRow = RatingData[number]
export type RatingKind = RatingRow["kind"]
type RatingRowOf<K extends RatingKind> = Extract<RatingRow, { kind: K }>
export type RatingMap = { [K in RatingKind]: RatingRowOf<K>[] }
export type RatingsPayload = { data: RatingData; meta: RatingResponse["meta"] }
