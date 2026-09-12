import { Router } from "express";
import { login, register } from "../controllers/auth.controller";
import { forgotPassword, resetPassword } from "../controllers/auth.controller";
import { forgotPasswordLimiter } from "../middleware/rateLimiter";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/reset-password", resetPassword);
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);

export default router;



