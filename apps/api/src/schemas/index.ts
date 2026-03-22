import { z } from "zod";
const passwordComplexity = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

export const registerBodySchema = z.object({
    email: z.email(),
    password: passwordComplexity,
    firstName: z.string().min(1),
    lastName: z.string().min(1).max(100).trim(),
    username: z.string().min(1).max(100).trim(),
});

export const loginBodySchema = z.object({
    email: z.email(),
    password: z.string().min(8),
});


export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;