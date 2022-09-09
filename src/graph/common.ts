import {
  ObjectViewVirtualExecutor,
  ObjectViewVirtualExecutorOptions
} from "@/graph";
import { GraphObject } from "@/graph/objects/types";

export const FIXED_OBJECT_FIELDS = [
  "id",
  "object_type",
  "created_at",
  "updated_at",
  "deleted_at",
];

export const OwnerViewVirtualExecutor: ObjectViewVirtualExecutor = async (
  object: GraphObject,
  { author }: ObjectViewVirtualExecutorOptions
): Promise<boolean> => {
  return (
    object.id === author.id ||
    object.owner === author.id ||
    object.user === author.id
  );
};
