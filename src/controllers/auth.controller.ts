import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import { signAccessToken } from "../lib/jwt";
import { prisma } from "../lib/prisma";
import { loginSchema, registerSchema } from "../validators/auth.validators";
import crypto from "crypto";
import { forgotPasswordSchema, resetPasswordSchema } from "../validators/auth.validators";
import { sendPasswordResetEmail } from "../lib/email";

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

const RESET_TOKEN_TTL_MS = 1000 * 60 * 30; // 30 minutes

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    validationError(res, parsed.error.issues);
    return;
  }

  const { email } = parsed.data;
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (user) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    const resetLink = `${process.env.APP_URL}/reset-password?token=${rawToken}`;

    try {
      await sendPasswordResetEmail(user.email, resetLink);
    } catch (err) {
      console.error("Failed to send password reset email:", err);
      // Don't leak email-sending failures to the client — the response
      // stays generic either way, so this fails silently from the user's view.
    }
  }

  res.status(200).json({
    message: "If an account with that email exists, a reset link has been sent.",
  });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    validationError(res, parsed.error.issues);
    return;
  }

  const { token, password } = parsed.data;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await prisma.user.findFirst({
    where: {
      resetToken: hashedToken,
      resetTokenExpiry: { gt: new Date() },
    },
  });

  if (!user) {
    res.status(400).json({ error: "Invalid or expired reset token" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: passwordHash,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  res.status(200).json({ message: "Password has been reset successfully" });
}