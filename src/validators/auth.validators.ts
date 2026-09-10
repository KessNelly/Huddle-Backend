import { z } from "zod";

const email = z.string().trim().email("A valid email address is required").max(254);

export const registerSchema = z.object({
  email,
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  name: z.string().trim().min(1, "Name cannot be empty").max(100).optional(),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required").max(72),
});
