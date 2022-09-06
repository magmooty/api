import { APIEndpoint, APIRequest, APIResponse } from "@/api/types";
import { apiWrapper } from "@/components";
import { Context } from "@/tracing";

export const searchEndpoint: APIEndpoint = apiWrapper(
  {
    name: "search",
    file: __filename,
  },
  async (ctx: Context, req: APIRequest, res: APIResponse) => {
    if (!req.user || !req.session) {
      return;
    }
  }
);
