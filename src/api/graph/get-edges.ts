import { validatePayload, verifyEdgeACL, verifyObjectACL } from "@/api/common";
import { APIEndpoint, APIRequest, APIResponse } from "@/api/types";
import { apiWrapper, persistence } from "@/components";
import { Context } from "@/tracing";
import { Record, Static, String } from "runtypes";

const GetEdgesParams = Record({
  src: String,
  edgeName: String,
});

type GetEdgesParams = Static<typeof GetEdgesParams>;

export const getEdgesEndpoint: APIEndpoint = apiWrapper(
  {
    name: "getEdges",
    file: __filename,
  },
  async (ctx: Context, req: APIRequest, res: APIResponse) => {
    if (!req.session || !req.user) {
      return;
    }

    const { params } = req;

    await validatePayload(ctx, params, GetEdgesParams);

    const { src, edgeName } = params as GetEdgesParams;

    await verifyEdgeACL(ctx, {
      aclMode: "hard",
      src,
      edgeName,
      method: "GET",
      roles: req.session.roles,
      author: req.user,
    });

    const objects = await persistence.getEdges(ctx, src, edgeName);

    const result = await Promise.all(
      objects.map((object) => {
        if (!req.session || typeof object === "string") {
          return;
        }

        return verifyObjectACL(ctx, {
          aclMode: "hard",
          method: "GET",
          objectType: object.object_type,
          roles: req.session.roles,
          singleFieldStrategy: "strip",
          author: req.user,
          object: object,
        });
      })
    );

    res.json(result);
  }
);
