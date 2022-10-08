import { APIEndpoint, APIRequest, APIResponse } from "@/api/types";
import { apiWrapper, persistence } from "@/components";
import { getObjectTypeFromId } from "@/graph";
import { GraphObject } from "@/graph/objects/types";
import { Context } from "@/tracing";
import { Record, Static, String } from "runtypes";
import { validatePayload, verifyObjectACL } from "../common";

const DeleteObjectParams = Record({
  id: String,
});

type DeleteObjectParams = Static<typeof DeleteObjectParams>;

export const deleteObjectEndpoint: APIEndpoint = apiWrapper(
  {
    name: "deleteObject",
    file: __filename,
  },
  async (ctx: Context, req: APIRequest, res: APIResponse) => {
    if (!req.session || !req.user) {
      return;
    }

    const { params } = req;

    await validatePayload(ctx, params, DeleteObjectParams);

    const aclCache: any = {};

    const { id } = params as DeleteObjectParams;

    const objectType = await getObjectTypeFromId(ctx, id);

    await verifyObjectACL(ctx, {
      author: req.user,
      method: "DELETE",
      aclMode: "soft",
      objectType,
      singleFieldStrategy: "error",
      roles: req.session.roles,
      aclCache,
    });

    const previous = await persistence.getObject<GraphObject>(ctx, id);

    await verifyObjectACL(ctx, {
      author: req.user,
      method: "DELETE",
      aclMode: "hard",
      objectType,
      singleFieldStrategy: "error",
      roles: req.session.roles,
      aclCache,
      object: previous,
    });

    const deletedObject = await persistence.deleteObject<GraphObject>(ctx, id, {
      author: req.user.id,
      previous,
    });

    const strippedObject = await verifyObjectACL(ctx, {
      author: req.user,
      method: "GET",
      aclMode: "hard",
      objectType,
      singleFieldStrategy: "strip",
      object: deletedObject,
      roles: req.session.roles,
      aclCache,
    });

    res.status(200).send(strippedObject);
  }
);
