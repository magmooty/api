import { Router } from "express";
import { loginEndpoint } from "./login";
import { refreshTokenEndpoint } from "./refresh-token";
import { signupEndpoint } from "./signup";
import { verifyCheckEndpoint } from "./verify-check";
import { verifyStartEndpoint } from "./verify-start";

const publicRouter = Router();

publicRouter.post("/login", loginEndpoint);
publicRouter.post("/signup", signupEndpoint);
publicRouter.post("/token/refresh", refreshTokenEndpoint);

const privateRouter = Router();

privateRouter.post("/verify-start", verifyStartEndpoint);
privateRouter.post("/verify-check", verifyCheckEndpoint);

export { publicRouter, privateRouter };
