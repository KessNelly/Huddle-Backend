import { Router } from "express";
import { createMessage, getMessages, listChannels } from "../controllers/channel.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.get("/", listChannels);
router.get("/:channelId/messages", getMessages);
router.post("/:channelId/messages", createMessage);

export default router;
