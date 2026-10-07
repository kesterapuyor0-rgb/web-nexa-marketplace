import { ObjectId } from "mongodb";

export function mongoIdFilters(id) {
  const filters = [{ id: String(id) }, { _id: String(id) }];
  if (typeof id === "string" && ObjectId.isValid(id)) {
    filters.push({ _id: new ObjectId(id) });
  }
  return filters;
}
