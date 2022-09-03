import { APIEndpoint, APIRequest, APIResponse } from "@/api/types";
import { apiWrapper, persistence } from "@/components";
import { getObjectTypeFromId } from "@/graph";
import { GraphObject } from "@/graph/objects/types";
import { PreUpdateObjectHook } from "@/persistence";
import { Context } from "@/tracing";
import { Record, Static, String } from "runtypes";
import { validateRequestBody, verifyObjectACL } from "../common";

const PatchObjectParams = Record({
  id: String,
});

type PatchObjectParams = Static<typeof PatchObjectParams>;

export const patchObjectEndpoint: APIEndpoint = apiWrapper(
  {
    name: "patchObject",
    file: __filename,
  },
  async (ctx: Context, req: APIRequest, res: APIResponse) => {
    const { params } = req;

    await validateRequestBody(ctx, params, PatchObjectParams);

    const { id } = params as PatchObjectParams;
    const { body } = req;

    const objectType = await getObjectTypeFromId(ctx, id);

    const aclCache = {};

    await verifyObjectACL(ctx, {
      author: req.user,
      method: "PATCH",
      aclMode: "soft",
      objectType,
      singleFieldStrategy: "error",
      roles: [],
      aclCache,
      keys: Object.keys(body),
    });

    const updatePreHook: PreUpdateObjectHook = async (previous) => {
      await verifyObjectACL(ctx, {
        author: req.user,
        method: "PATCH",
        aclMode: "hard",
        objectType,
        singleFieldStrategy: "error",
        object: previous,
        roles: [],
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
      roles: [],
      aclCache,
    });

    res.json(strippedObject);
  }
);
