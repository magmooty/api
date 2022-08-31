import { APIEndpoint, APIRequest, APIResponse } from "@/api/types";
import { apiWrapper } from "@/components";
import { Context } from "@/tracing";
import { verifyObjectACL } from "../common";

export const meEndpoint: APIEndpoint = apiWrapper(
  {
    name: "me",
    file: __filename,
  },
  async (ctx: Context, req: APIRequest, res: APIResponse) => {
    if (!req.user) {
      return;
    }

    const strippedObject = await verifyObjectACL(ctx, {
      author: req.user,
      method: "GET",
      aclMode: "hard",
      objectType: "user",
      singleFieldStrategy: "strip",
      object: req.user,
      roles: [],
    });

    res.json(strippedObject);
  }
);
