import { z } from "zod/v4";

function normalizeUrl(val: string): string {
  const trimmed = val.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export const loginSchema = z.object({
  email: z.email("Email inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

export const registerSchema = z.object({
  fullName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.email("Email inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  city: z.string().min(1, "Selecione sua cidade"),
});

export const profileUpdateSchema = z.object({
  fullName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  city: z.string().min(1, "Selecione sua cidade"),
  notificationsEnabled: z.boolean(),
});

export const raceSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  date: z.string().min(1, "Data é obrigatória"),
  startTime: z.string().min(1, "Horário é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().default("SP"),
  address: z.string().min(3, "Endereço é obrigatório"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  distances: z.array(z.string()).min(1, "Selecione pelo menos uma distância"),
  registrationPrice: z.string().min(1, "Valor da inscrição é obrigatório"),
  registrationLink: z.string().min(1, "Link de inscrição é obrigatório").transform(normalizeUrl).pipe(z.url("Link de inscrição inválido")),
  registrationDeadline: z.string().min(1, "Prazo de inscrição é obrigatório"),
  prizeType: z.enum(["money", "trophy", "both", "none"]),
  prizeDetails: z.string().optional(),
  routeDescription: z.string().optional(),
  routeImageUrl: z.string().optional(),
  organizer: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["confirmed", "postponed", "cancelled"]).default("confirmed"),
});

export const suggestionSchema = z.object({
  name: z.string().min(3, "Nome da corrida deve ter pelo menos 3 caracteres"),
  date: z.string().optional(),
  city: z.string().min(1, "Cidade é obrigatória"),
  link: z.union([z.string().transform(normalizeUrl).pipe(z.url("Link inválido")), z.literal("")]).optional(),
  notes: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type RaceInput = z.infer<typeof raceSchema>;
export type SuggestionInput = z.infer<typeof suggestionSchema>;
