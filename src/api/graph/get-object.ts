import { APIEndpoint, APIRequest, APIResponse } from "@/api/types";
import { apiWrapper, persistence } from "@/components";
import { getObjectTypeFromId } from "@/graph";
import { GraphObject } from "@/graph/objects/types";
import { Context } from "@/tracing";
import { Record, Static, String } from "runtypes";
import { validateRequestBody, verifyObjectACL } from "../common";

const GetObjectParams = Record({
  id: String,
});

type GetObjectParams = Static<typeof GetObjectParams>;

export const getObjectEndpoint: APIEndpoint = apiWrapper(
  {
    name: "getObject",
    file: __filename,
  },
  async (ctx: Context, req: APIRequest, res: APIResponse) => {
    const { params } = req;

    await validateRequestBody(ctx, params, GetObjectParams);

    const { id } = params as GetObjectParams;

    const objectType = await getObjectTypeFromId(ctx, id);

    await verifyObjectACL(ctx, {
      author: req.user,
      method: "GET",
      aclMode: "soft",
      objectType,
      singleFieldStrategy: "strip",
      roles: [],
    });

    const object = await persistence.getObject<GraphObject>(ctx, id);

    const strippedObject = await verifyObjectACL(ctx, {
      author: req.user,
      method: "GET",
      aclMode: "hard",
      objectType,
      singleFieldStrategy: "strip",
      object,
      roles: [],
    });

    if (object) {
      res.json(strippedObject);
    }
  }
);
