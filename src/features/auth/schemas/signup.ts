import { z } from "zod";

/** Roles that can be chosen at signup (admin is assigned separately) */
export const SIGNUP_ROLES = ["member", "organizer"] as const;
export type SignupRole = (typeof SIGNUP_ROLES)[number];

export const signupSchema = z
  .object({
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    role: z.enum(SIGNUP_ROLES),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type SignupInput = z.infer<typeof signupSchema>;
