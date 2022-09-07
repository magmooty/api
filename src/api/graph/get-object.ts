import { APIEndpoint, APIRequest, APIResponse } from "@/api/types";
import { apiWrapper, persistence } from "@/components";
import { getObjectTypeFromId } from "@/graph";
import { GraphObject } from "@/graph/objects/types";
import { Context } from "@/tracing";
import { Optional, Record, Static, String } from "runtypes";
import { validatePayload, verifyObjectACL } from "../common";
import { performExpand } from "../expand";

const GetObjectParams = Record({
  id: String,
});

const GetObjectQuery = Record({
  expand: Optional(String),
});

type GetObjectParams = Static<typeof GetObjectParams>;
type GetObjectQuery = Static<typeof GetObjectQuery>;

export const getObjectEndpoint: APIEndpoint = apiWrapper(
  {
    name: "getObject",
    file: __filename,
  },
  async (ctx: Context, req: APIRequest, res: APIResponse) => {
    if (!req.session) {
      return;
    }

    const { params, query } = req;

    await validatePayload(ctx, params, GetObjectParams);
    await validatePayload(ctx, query, GetObjectQuery);

    const aclCache: any = {};

    const { id } = params as GetObjectParams;
    const { expand } = query as GetObjectQuery;

    const objectType = await getObjectTypeFromId(ctx, id);

    await verifyObjectACL(ctx, {
      author: req.user,
      method: "GET",
      aclMode: "soft",
      objectType,
      singleFieldStrategy: "strip",
      roles: req.session.roles,
      aclCache,
    });

    let object = await persistence.getObject<GraphObject>(ctx, id);

    const objectKeysBeforeExpansion = Object.keys(object);

    if (expand) {
      object = await performExpand(ctx, object, expand, {
        author: req.user,
        aclCache,
        roles: req.session.roles,
      });
    }

    const strippedObject = await verifyObjectACL(ctx, {
      author: req.user,
      method: "GET",
      aclMode: "hard",
      objectType,
      singleFieldStrategy: "strip",
      object,
      roles: req.session.roles,
      aclCache,
      keys: objectKeysBeforeExpansion,
    });

    res.json(strippedObject);
  }
);
