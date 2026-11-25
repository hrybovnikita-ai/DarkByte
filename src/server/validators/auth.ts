import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128)
  .regex(/[A-Za-z]/, "Password must include a letter")
  .regex(/[0-9]/, "Password must include a number");

export const registerSchema = z.object({
  name: z.string().min(1).max(120).trim(),
  email: z.string().email().max(320).toLowerCase().trim(),
  password: passwordSchema,
});

export const forgotPasswordSchema = z.object({
  email: z.string().email().max(320).toLowerCase().trim(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(16).max(256),
  email: z.string().email().max(320).toLowerCase().trim(),
  password: passwordSchema,
});

export const verifyEmailSchema = z.object({
  token: z.string().min(16).max(256),
  email: z.string().email().max(320).toLowerCase().trim(),
});

export const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});