import { Router } from "express";
import { meEndpoint } from "./me";

const privateRouter = Router();

privateRouter.get("/me", meEndpoint);

export { privateRouter };
