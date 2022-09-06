import { APIEndpoint, APIRequest, APIResponse } from "@/api/types";
import { apiWrapper, persistence } from "@/components";
import { getObjectTypeFromId } from "@/graph";
import { GraphObject } from "@/graph/objects/types";
import { PreUpdateObjectHook } from "@/persistence";
import { Context } from "@/tracing";
import { Record, Static, String } from "runtypes";
import { validatePayload, verifyObjectACL } from "../common";

const UpdateObjectParams = Record({
  id: String,
});

type UpdateObjectParams = Static<typeof UpdateObjectParams>;

export const updateObjectEndpoint: APIEndpoint = apiWrapper(
  {
    name: "updateObject",
    file: __filename,
  },
  async (ctx: Context, req: APIRequest, res: APIResponse) => {
    if (!req.session) {
      return;
    }

    const { params } = req;

    await validatePayload(ctx, params, UpdateObjectParams);

    const { id } = params as UpdateObjectParams;
    const { body } = req;

    const objectType = await getObjectTypeFromId(ctx, id);

    const aclCache = {};

    await verifyObjectACL(ctx, {
      author: req.user,
      method: "PATCH",
      aclMode: "soft",
      objectType,
      singleFieldStrategy: "error",
      roles: req.session.roles,
      aclCache,
      keys: Object.keys(body),
    });

    const updatePreHook: PreUpdateObjectHook = async (previous) => {
      if (!req.session) {
        return;
      }

      await verifyObjectACL(ctx, {
        author: req.user,
        method: "PATCH",
        aclMode: "hard",
        objectType,
        singleFieldStrategy: "error",
        object: previous,
        roles: req.session.roles,
        aclCache,
        keys: Object.keys(body),
      });
    };

    const object = await persistence.updateObject<GraphObject>(
      ctx,
      id,
      req.body,
      { hooks: { pre: updatePreHook }, author: req.user }
    );

    const strippedObject = await verifyObjectACL(ctx, {
      author: req.user,
      method: "GET",
      aclMode: "hard",
      objectType,
      singleFieldStrategy: "strip",
      object,
      roles: req.session.roles,
      aclCache,
    });

    res.json(strippedObject);
  }
);
