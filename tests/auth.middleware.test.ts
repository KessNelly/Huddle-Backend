import jwt from "jsonwebtoken";
import { jest } from "@jest/globals";
import { requireAuth } from "../src/middleware/auth.middleware";

beforeEach(() => {
  process.env.JWT_SECRET = "test-secret";
});

it("attaches the authenticated user to the request", () => {
  const token = jwt.sign({ email: "ada@example.com" }, "test-secret", { subject: "user-1" });
  const req = { headers: { authorization: `Bearer ${token}` } } as any;
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
  const next = jest.fn();

  requireAuth(req, res, next);

  expect(next).toHaveBeenCalled();
  expect(req.user).toEqual({ id: "user-1", email: "ada@example.com" });
});

it("rejects missing or invalid tokens", () => {
  const req = { headers: {} } as any;
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;

  requireAuth(req, res, jest.fn());

  expect(res.status).toHaveBeenCalledWith(401);
  expect(res.json).toHaveBeenCalledWith({ error: "Authentication is required" });
});
