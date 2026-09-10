import jwt from "jsonwebtoken";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import request from "supertest";

type Channel = { id: string; name: string; createdAt: Date; /* add other fields */ };

const channelFindMany = jest.fn() as jest.MockedFunction<() => Promise<Channel[]>>;
const channelFindUnique = jest.fn() as jest.MockedFunction<() => Promise<Channel | null>>;
const messageFindMany = jest.fn() as jest.MockedFunction<() => Promise<Message[]>>;
const messageCreate = jest.fn() as jest.MockedFunction<() => Promise<Message>>;

jest.mock("../src/lib/prisma", () => ({
  prisma: {
    channel: { findMany: channelFindMany, findUnique: channelFindUnique },
    message: { findMany: messageFindMany, create: messageCreate },
  },
}));

import app from "../src/app";
import { Message } from "@prisma/client";

const channel = { id: "1d0c1a8d-48af-4f8d-8ea5-0c43515cbba1", name: "general", createdAt: new Date() };
const author = { id: "user-a", name: "Jordan Tate", email: "jordan@example.com" };
const secondUser = { id: "user-b", name: "Maya Chen", email: "maya@example.com" };

const tokenFor = (user: typeof author) =>
  jwt.sign({ email: user.email }, "test-secret", { subject: user.id, expiresIn: "1h" });

beforeEach(() => {
  process.env.JWT_SECRET = "test-secret";
  channelFindMany.mockReset();
  channelFindUnique.mockReset();
  messageFindMany.mockReset();
  messageCreate.mockReset();
});

describe("channel endpoints", () => {
  it("requires authentication to list channels", async () => {
    const response = await request(app).get("/api/channels");
    expect(response.status).toBe(401);
  });

  it("returns available channels to an authenticated user", async () => {
    channelFindMany.mockResolvedValue([{ id: "1", name: "general", createdAt: new Date() }]);
    const response = await request(app).get("/api/channels").set("Authorization", `Bearer ${tokenFor(author)}`);

    expect(response.status).toBe(200);
    expect(response.body.channels.map((item: { name: string }) => item.name)).toEqual(["general"]);
  });

  it("lets one user post a message that another user can retrieve", async () => {
    const createdAt = new Date("2026-09-10T10:14:00.000Z");
    const updatedAt = new Date("2026-09-10T10:14:00.000Z");
    const storedMessage = { id: "message-1", content: "Auth API is live on staging.", createdAt, updatedAt, channelId: channel.id, userId: author.id, user: author };
    channelFindUnique.mockResolvedValue(channel);
    messageCreate.mockResolvedValue(storedMessage);

    const post = await request(app)
      .post(`/api/channels/${channel.id}/messages`)
      .set("Authorization", `Bearer ${tokenFor(author)}`)
      .send({ content: "  Auth API is live on staging.  " });

    expect(post.status).toBe(201);
    expect(post.body.message).toMatchObject({ content: "Auth API is live on staging.", author });

    messageFindMany.mockResolvedValue([storedMessage]);
    const history = await request(app)
      .get(`/api/channels/${channel.id}/messages`)
      .set("Authorization", `Bearer ${tokenFor(secondUser)}`);

    expect(history.status).toBe(200);
    expect(history.body.messages).toHaveLength(1);
    expect(history.body.messages[0]).toMatchObject({ content: "Auth API is live on staging.", author });
  });

  it("returns an empty list for an empty channel and rejects blank messages", async () => {
    channelFindUnique.mockResolvedValue(channel);
    messageFindMany.mockResolvedValue([]);
    const history = await request(app)
      .get(`/api/channels/${channel.id}/messages`)
      .set("Authorization", `Bearer ${tokenFor(author)}`);
    expect(history.status).toBe(200);
    expect(history.body.messages).toEqual([]);

    const post = await request(app)
      .post(`/api/channels/${channel.id}/messages`)
      .set("Authorization", `Bearer ${tokenFor(author)}`)
      .send({ content: "   " });
    expect(post.status).toBe(400);
    expect(post.body.details).toContainEqual({ field: "content", message: "Message content cannot be empty" });
  });

  it("returns a clear response when the channel does not exist", async () => {
    channelFindUnique.mockResolvedValue(null);
    const response = await request(app)
      .get(`/api/channels/${channel.id}/messages`)
      .set("Authorization", `Bearer ${tokenFor(author)}`);
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Channel not found" });
  });
});
