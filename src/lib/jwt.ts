import jwt, { SignOptions } from "jsonwebtoken";

const getSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return secret;
};

export function signAccessToken(user: { id: string; email: string }): string {
  const expiresIn = (process.env.JWT_EXPIRES_IN || "1h") as SignOptions["expiresIn"];
  return jwt.sign({ email: user.email }, getSecret(), {
    subject: user.id,
    expiresIn,
  });
}

export function verifyAccessToken(token: string): { id: string; email: string } {
  const payload = jwt.verify(token, getSecret());
  if (typeof payload === "string" || !payload.sub || typeof payload.email !== "string") {
    throw new Error("Invalid token payload");
  }
  return { id: payload.sub, email: payload.email };
}
