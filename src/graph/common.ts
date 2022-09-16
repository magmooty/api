import {
  ObjectViewVirtualExecutor,
  ObjectViewVirtualExecutorOptions,
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

export const SpaceAdminVirtualExecutor: ObjectViewVirtualExecutor = async (
  object: GraphObject,
  { roles }: ObjectViewVirtualExecutorOptions
): Promise<boolean> => {
  const { space } = object;

  const foundRole = roles.find((role) => {
    // The 2 index is where the space lives
    return space === role.split("|")[2];
  });

  return foundRole ? true : false;
};
