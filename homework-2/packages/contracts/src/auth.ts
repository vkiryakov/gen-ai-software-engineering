import { z } from 'zod';

export const LoginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginInputSchema>;

export const LoginResponseSchema = z.object({
  token: z.string(),
  user: z.object({ email: z.string().email() }),
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
