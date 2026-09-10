import { Router } from "express";
import authRoutes from "./auth.routes";
import channelRoutes from "./channel.routes";
import healthRoutes from "./health.routes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/channels", channelRoutes);

export default router;
