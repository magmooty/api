import { Router } from "express";
import { getObjectEndpoint } from "./get-object";
import { patchObjectEndpoint } from "./patch-object";

const privateRouter = Router();

privateRouter.get("/:id", getObjectEndpoint);
privateRouter.patch("/:id", patchObjectEndpoint);

export { privateRouter };
