import { Router } from "express";
import { loginEndpoint } from "./login";
import { refreshTokenEndpoint } from "./refresh-token";
import { signupEndpoint } from "./signup";

const router = Router();

router.post("/login", loginEndpoint);
router.post("/signup", signupEndpoint);
router.post("/token/refresh", refreshTokenEndpoint);

export default router;
