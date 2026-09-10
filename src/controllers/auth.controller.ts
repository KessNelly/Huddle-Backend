import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import { signAccessToken } from "../lib/jwt";
import { prisma } from "../lib/prisma";
import { loginSchema, registerSchema } from "../validators/auth.validators";

const userResponse = (user: { id: string; email: string; name: string | null; createdAt: Date }) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  createdAt: user.createdAt,
});

const validationError = (res: Response, issues: { message: string; path: PropertyKey[] }[]) =>
  res.status(400).json({
    error: "Invalid request data",
    details: issues.map((issue) => ({ field: issue.path.join("."), message: issue.message })),
  });

export async function register(req: Request, res: Response): Promise<void> {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    validationError(res, parsed.error.issues);
    return;
  }

  const { email, password, name } = parsed.data;
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email: email.toLowerCase(), password: passwordHash, name },
    });

    res.status(201).json({
      message: "Account created. Sign in to receive an access token.",
      user: userResponse(user),
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      res.status(409).json({ error: "An account with this email already exists" });
      return;
    }
    throw error;
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    validationError(res, parsed.error.issues);
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (!user || !(await bcrypt.compare(parsed.data.password, user.password))) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  res.status(200).json({
    message: "Signed in successfully",
    accessToken: signAccessToken(user),
    tokenType: "Bearer",
    user: userResponse(user),
  });
}
