import { ObjectViewVirtualExecutor } from "@/graph";
import { GraphObject, User } from "@/graph/objects/types";

export const OwnerViewVirtual: ObjectViewVirtualExecutor = (
  object: GraphObject,
  author: User
) => {
  return object.id === author.id;
};
