import { z } from "zod/v4";

export function normalizeUrl(val: string): string {
  const trimmed = val.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export const loginSchema = z.object({
  email: z.email("Email inválido"),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
});

const registrationBatchItemSchema = z.object({
  label: z.string().optional().default(""),
  price: z.string().min(1, "Preço é obrigatório"),
});

const registrationBatchSchema = z.object({
  name: z.string().min(1, "Nome do lote é obrigatório"),
  deadline: z.string().optional(),
  items: z.array(registrationBatchItemSchema).min(1, "Adicione pelo menos um item ao lote"),
});

export const raceSchemaBase = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  date: z.string().min(1, "Data é obrigatória"),
  startTime: z.string().min(1, "Horário é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().default("SP"),
  address: z.string().min(3, "Endereço é obrigatório"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  distances: z.array(z.string()).min(1, "Selecione pelo menos uma distância"),
  registrationPrices: z.record(z.string(), z.string()).optional(),
  registrationPrice: z.string().optional().default(""),
  registrationBatches: z.array(registrationBatchSchema).optional(),
  registrationLink: z.string().min(1, "Link de inscrição é obrigatório").transform(normalizeUrl).pipe(z.url("Link de inscrição inválido")),
  registrationDeadline: z.string().min(1, "Prazo de inscrição é obrigatório"),
  prizeType: z.enum(["money", "trophy", "both", "none"]),
  prizeDetails: z.string().optional(),
  routeDescription: z.string().optional(),
  imageUrl: z.string().url("URL da imagem inválida").optional(),
  routeImageUrl: z.string().optional(),
  organizer: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["confirmed", "pending_review", "postponed", "cancelled", "rejected"]).default("confirmed"),
});

export const raceSchema = raceSchemaBase
  .refine(
    (data) => !data.registrationDeadline || !data.date || data.registrationDeadline <= data.date,
    { message: "Prazo deve ser igual ou anterior à data da corrida", path: ["registrationDeadline"] }
  )
  .refine(
    (data) => {
      const hasPrices = data.registrationPrices && Object.keys(data.registrationPrices).length > 0;
      const hasBatches = data.registrationBatches && data.registrationBatches.length > 0;
      return hasPrices || hasBatches || (data.registrationPrice && data.registrationPrice.length > 0);
    },
    { message: "Informe o valor por distância, adicione lotes de preço, ou preencha o campo de valor da inscrição", path: ["registrationPrice"] }
  );

export type LoginInput = z.infer<typeof loginSchema>;
export type RaceInput = z.infer<typeof raceSchema>;
