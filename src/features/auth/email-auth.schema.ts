import { z } from 'zod';

const email = z.email('Informe um e-mail válido.').trim();
const password = z.string().min(6, 'A senha precisa ter pelo menos 6 caracteres.');

export const signInSchema = z.object({ email, password });
export const signUpSchema = z.object({ email, password });
export const recoverySchema = z.object({ email });
export const resetPasswordSchema = z.object({ password });

export type EmailCredentials = z.infer<typeof signInSchema>;
