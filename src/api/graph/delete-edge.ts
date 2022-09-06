import { validatePayload, verifyEdgeACL } from "@/api/common";
import { APIEndpoint, APIRequest, APIResponse } from "@/api/types";
import { apiWrapper, persistence } from "@/components";
import { Context } from "@/tracing";
import { Record, Static, String } from "runtypes";

const DeleteEdgeParams = Record({
  src: String,
  edgeName: String,
  dst: String,
});

type DeleteEdgeParams = Static<typeof DeleteEdgeParams>;

export const deleteEdgeEndpoint: APIEndpoint = apiWrapper(
  {
    name: "deleteEdge",
    file: __filename,
  },
  async (ctx: Context, req: APIRequest, res: APIResponse) => {
    if (!req.session || !req.user) {
      return;
    }

    const { params } = req;

    await validatePayload(ctx, params, DeleteEdgeParams);

    const { src, edgeName, dst } = params as DeleteEdgeParams;

    await verifyEdgeACL(ctx, {
      aclMode: "hard",
      src,
      edgeName,
      method: "DELETE",
      roles: req.session.roles,
      author: req.user,
    });

    await persistence.deleteEdge(ctx, src, edgeName, dst, { author: req.user });

    res.status(200).send();
  }
);
