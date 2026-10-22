import { z } from "zod";

export const RegisterSchema = z
  .object({
    email: z
      .string()
      .email("Please provide a valid email address.")
      .max(100, "Email must not exceed 100 characters.")
      .trim()
      .toLowerCase(),
    full_name: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters.")
      .max(70, "Full name must not exceed 70 characters.")
      .regex(
        /^[a-zA-Z\s'’.\-]+$/,
        "Full name contains invalid characters. Only letters, spaces, hyphens, and apostrophes are allowed."
      ),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long.")
      .max(128, "Password must not exceed 128 characters.")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
      .regex(/[0-9]/, "Password must contain at least one number.")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character."),
  })
  .strict();

export const LoginSchema = z
  .object({
    email: z
      .string()
      .email("Please provide a valid email address.")
      .max(100, "Email must not exceed 100 characters.")
      .trim()
      .toLowerCase(),
    password: z.string().min(1, "Password is required.").max(128),
  })
  .strict();

export const UpdateRoleSchema = z
  .object({
    role: z.enum(["USER", "ADMIN"]),
  })
  .strict();

export const UpdateStatusSchema = z
  .object({
    is_active: z.boolean(),
  })
  .strict();
