import { validatePayload, verifyEdgeACL, verifyObjectACL } from "@/api/common";
import { APIEndpoint, APIRequest, APIResponse } from "@/api/types";
import { apiWrapper, persistence } from "@/components";
import { Context } from "@/tracing";
import { Optional, Record, Static, String } from "runtypes";
import { expandObject } from "../expand";

const GetEdgesParams = Record({
  src: String,
  edgeName: String,
});

type GetEdgesParams = Static<typeof GetEdgesParams>;

const GetEdgesQuery = Record({
  expand: Optional(String),
});

type GetEdgesQuery = Static<typeof GetEdgesQuery>;

export const getEdgesEndpoint: APIEndpoint = apiWrapper(
  {
    name: "getEdges",
    file: __filename,
  },
  async (ctx: Context, req: APIRequest, res: APIResponse) => {
    if (!req.session || !req.user) {
      return;
    }

    const { params, query } = req;

    await validatePayload(ctx, params, GetEdgesParams);
    await validatePayload(ctx, query, GetEdgesQuery);

    const { src, edgeName } = params as GetEdgesParams;
    const { expand } = query as GetEdgesQuery;

    await verifyEdgeACL(ctx, {
      aclMode: "hard",
      src,
      edgeName,
      method: "GET",
      roles: req.session.roles,
      author: req.user,
    });

    const objects = await persistence.getEdges(ctx, src, edgeName);

    const aclCache = {};

    const result = await Promise.all(
      objects.map(async (object) => {
        if (!req.session || typeof object === "string") {
          return;
        }

        const objectKeysBeforeExpansion = Object.keys(object);

        if (expand) {
          object = await expandObject(ctx, object, expand, {
            author: req.user,
            aclCache,
            roles: req.session.roles,
          });
        }

        return verifyObjectACL(ctx, {
          aclMode: "hard",
          method: "GET",
          objectType: object.object_type,
          roles: req.session.roles,
          singleFieldStrategy: "strip",
          author: req.user,
          object: object,
          aclCache,
          keys: objectKeysBeforeExpansion,
        });
      })
    );

    res.json(result);
  }
);
