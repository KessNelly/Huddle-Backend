import bcrypt from "bcrypt";
import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import request from "supertest";

const create = jest.fn();
const findUnique = jest.fn();

jest.mock("../src/lib/prisma", () => ({
  prisma: { user: { create, findUnique } },
}));

import app from "../src/app";

const user = {
  id: "user-1",
  email: "ada@example.com",
  name: "Ada",
  password: "",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

beforeEach(() => {
  process.env.JWT_SECRET = "test-secret";
  create.mockReset();
  findUnique.mockReset();
});

describe("POST /api/auth/register", () => {
  it("creates an account and never returns its password", async () => {
    create.mockResolvedValue(user);
    const response = await request(app).post("/api/auth/register").send({
      email: "Ada@Example.com",
      password: "secure-password",
      name: "Ada",
    });

    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({ id: "user-1", email: "ada@example.com", name: "Ada" });
    expect(response.body).not.toHaveProperty("password");
    expect(create.mock.calls[0][0].data.password).not.toBe("secure-password");
  });

  it("rejects invalid input", async () => {
    const response = await request(app).post("/api/auth/register").send({ email: "invalid", password: "short" });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid request data");
  });
});

describe("POST /api/auth/login", () => {
  it("issues a JWT for valid credentials", async () => {
    findUnique.mockResolvedValue({ ...user, password: await bcrypt.hash("secure-password", 4) });
    const response = await request(app).post("/api/auth/login").send({
      email: "ada@example.com",
      password: "secure-password",
    });

    expect(response.status).toBe(200);
    expect(jwt.verify(response.body.accessToken, "test-secret")).toMatchObject({ sub: "user-1", email: "ada@example.com" });
  });

  it("uses the same response for unknown email and bad password", async () => {
    findUnique.mockResolvedValue(null);
    const response = await request(app).post("/api/auth/login").send({ email: "nobody@example.com", password: "anything" });
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Invalid email or password" });
  });
});
