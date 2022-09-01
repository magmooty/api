import { Router } from "express";
import { createObjectEndpoint } from "./create-object";
import { getObjectEndpoint } from "./get-object";
import { patchObjectEndpoint } from "./patch-object";

const privateRouter = Router();

privateRouter.post("/", createObjectEndpoint);
privateRouter.get("/:id", getObjectEndpoint);
privateRouter.patch("/:id", patchObjectEndpoint);

export { privateRouter };
