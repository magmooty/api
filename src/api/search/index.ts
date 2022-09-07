import { Router } from "express";
import { searchEndpoint } from "./search";

const privateRouter = Router();

privateRouter.post("/query/:index", searchEndpoint);

export { privateRouter };
