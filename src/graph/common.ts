import { ObjectViewVirtualExecutor } from "@/graph";
import { GraphObject, User } from "@/graph/objects/types";

export const OwnerViewVirtualExecutor: ObjectViewVirtualExecutor = (
  object: GraphObject,
  author: User
) => {
  return object.id === author.id;
};
