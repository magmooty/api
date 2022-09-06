import { Router } from "express";
import { createEdgeEndpoint } from "./create-edge";
import { createObjectEndpoint } from "./create-object";
import { deleteEdgeEndpoint } from "./delete-edge";
import { getEdgesEndpoint } from "./get-edges";
import { getObjectEndpoint } from "./get-object";
import { updateObjectEndpoint } from "./update-object";

const privateRouter = Router();

// Objects
privateRouter.post("/", createObjectEndpoint);
privateRouter.get("/:id", getObjectEndpoint);
privateRouter.patch("/:id", updateObjectEndpoint);

// Edges
privateRouter.get("/:src/:edgeName", getEdgesEndpoint);
privateRouter.post("/:src/:edgeName/:dst", createEdgeEndpoint);
privateRouter.delete("/:src/:edgeName/:dst", deleteEdgeEndpoint);

export { privateRouter };
