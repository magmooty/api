import { APIEndpoint, APIRequest, APIResponse } from "@/api/types";
import { apiWrapper, persistence } from "@/components";
import { checkIfObjectTypeExists } from "@/graph";
import { GraphObject, ObjectType } from "@/graph/objects/types";
import { Context } from "@/tracing";
import { Record, Static, String } from "runtypes";
import { validatePayload, verifyEdgeACL, verifyObjectACL } from "@/api/common";

const CreateEdgeParams = Record({
  src: String,
  edgeName: String,
  dst: String,
});

type CreateEdgeParams = Static<typeof CreateEdgeParams>;

export const createEdgeEndpoint: APIEndpoint = apiWrapper(
  {
    name: "createEdge",
    file: __filename,
  },
  async (ctx: Context, req: APIRequest, res: APIResponse) => {
    if (!req.session || !req.user) {
      return;
    }

    const { params } = req;

    await validatePayload(ctx, params, CreateEdgeParams);

    const { src, edgeName, dst } = params as CreateEdgeParams;

    await verifyEdgeACL(ctx, {
      aclMode: "hard",
      src,
      edgeName,
      method: "POST",
      roles: req.session.roles,
      author: req.user,
    });

    await persistence.createEdge(ctx, src, edgeName, dst, {
      author: req.user.id,
    });

    res.status(200).send();
  }
);
