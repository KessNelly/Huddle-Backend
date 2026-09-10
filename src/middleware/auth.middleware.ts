import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/jwt";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const [scheme, token] = req.headers.authorization?.split(" ") ?? [];
  if (scheme !== "Bearer" || !token) {
    res.status(401).json({ error: "Authentication is required" });
    return;
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired access token" });
  }
}
