import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { channelIdSchema, createMessageSchema, messageListSchema } from "../validators/channel.validators";

const authorSelect = { id: true, name: true, email: true } as const;

const validationError = (res: Response, issues: { message: string; path: PropertyKey[] }[]) =>
  res.status(400).json({
    error: "Invalid request data",
    details: issues.map((issue) => ({ field: issue.path.join("."), message: issue.message })),
  });

const formatMessage = (message: {
  id: string;
  content: string;
  createdAt: Date;
  user: { id: string; name: string | null; email: string };
}) => ({
  id: message.id,
  content: message.content,
  createdAt: message.createdAt,
  author: message.user,
});

export async function listChannels(_req: Request, res: Response): Promise<void> {
  const channels = await prisma.channel.findMany({ orderBy: { name: "asc" } });
  res.status(200).json({ channels });
}

export async function getMessages(req: Request, res: Response): Promise<void> {
  const params = channelIdSchema.safeParse(req.params);
  const query = messageListSchema.safeParse(req.query);
  if (!params.success) {
    validationError(res, params.error.issues);
    return;
  }
  if (!query.success) {
    validationError(res, query.error.issues);
    return;
  }

  const channel = await prisma.channel.findUnique({ where: { id: params.data.channelId } });
  if (!channel) {
    res.status(404).json({ error: "Channel not found" });
    return;
  }

  const messages = await prisma.message.findMany({
    where: { channelId: channel.id },
    include: { user: { select: authorSelect } },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: query.data.limit,
  });

  res.status(200).json({ channel, messages: messages.map(formatMessage) });
}

export async function createMessage(req: Request, res: Response): Promise<void> {
  const params = channelIdSchema.safeParse(req.params);
  const body = createMessageSchema.safeParse(req.body);
  if (!params.success) {
    validationError(res, params.error.issues);
    return;
  }
  if (!body.success) {
    validationError(res, body.error.issues);
    return;
  }

  const channel = await prisma.channel.findUnique({ where: { id: params.data.channelId } });
  if (!channel) {
    res.status(404).json({ error: "Channel not found" });
    return;
  }

  const message = await prisma.message.create({
    data: {
      content: body.data.content,
      channelId: channel.id,
      userId: req.user!.id,
    },
    include: { user: { select: authorSelect } },
  });

  res.status(201).json({ message: formatMessage(message) });
}
