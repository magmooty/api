import { GraphObject } from "@/graph/objects/types";
import { IndexName } from "../mapping";
import { SyncOperation } from "../types";

export const universalDeleteGenerator = (
  index: IndexName,
  object: GraphObject
): SyncOperation[] => {
  return [
    {
      index,
      id: object.id,
      method: "delete",
      data: {},
    },
  ];
};
