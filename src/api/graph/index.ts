import { Router } from "express";
import { getObjectEndpoint } from "./get-object";

const privateRouter = Router();

privateRouter.get("/:id", getObjectEndpoint);

export { privateRouter };
