import { z } from "zod";

export const RegisterSchema = z.object({
  email: z.string().email("Invalid email address"),
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const UpdateRoleSchema = z.object({
  role: z.enum(["USER", "ADMIN"]),
});

export const UpdateStatusSchema = z.object({
  is_active: z.boolean(),
});
