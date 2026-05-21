import { z } from "zod";

/**
 * What the admin autofill returns. Mirrors raceSchemaBase but every field is
 * nullable because the LLM should not invent data. Front-end merges this into
 * the form state, only filling fields the admin has not already typed.
 *
 * Strings are kept loose (no .url() etc.) so a partial / truncated extraction
 * still validates. Final validation against raceSchema happens on submit.
 */
export const raceExtractionSchema = z.object({
  name: z
    .string()
    .max(200)
    .nullable()
    .describe("Nome oficial da prova."),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .describe("Data da prova no formato ISO YYYY-MM-DD."),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable()
    .describe("Horário de largada no formato HH:MM (24h)."),
  city: z
    .string()
    .max(120)
    .nullable()
    .describe("Cidade onde acontece a prova (sem o estado)."),
  state: z
    .string()
    .length(2)
    .nullable()
    .describe("UF da cidade, 2 letras maiúsculas (ex: SP)."),
  address: z
    .string()
    .max(500)
    .nullable()
    .describe("Endereço completo do local de largada."),
  distances: z
    .array(z.string().min(1).max(16))
    .nullable()
    .describe(
      "Distâncias oferecidas em formato curto e minúsculo: ['5k', '10k', '21k', '42k']. Use 'outro' apenas se necessário.",
    ),
  registrationPrice: z
    .string()
    .max(200)
    .nullable()
    .describe(
      "Observações textuais sobre o valor (ex: 'Lote promocional até 06/04', regras de desconto). NÃO inclua o valor em si aqui se já estiver em registrationPrices.",
    ),
  registrationPrices: z
    .record(z.string().min(1).max(16), z.string().min(1).max(64))
    .nullable()
    .describe(
      "Preço por distância. Use a mesma chave de distance ('5k', '10k', '21k'). Valor como string PT-BR ('149,90' ou 'R$ 149,90'). null se não houver preço por distância.",
    ),
  registrationLink: z
    .string()
    .max(2048)
    .nullable()
    .describe("URL absoluta da página de inscrição."),
  registrationDeadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .describe("Prazo final de inscrição em ISO YYYY-MM-DD."),
  prizeType: z
    .enum(["money", "trophy", "both", "none"])
    .nullable()
    .describe("Tipo de premiação predominante."),
  prizeDetails: z
    .string()
    .max(2000)
    .nullable()
    .describe(
      "Detalhes textuais da premiação em PT-BR. Mantenha valores e categorias.",
    ),
  organizer: z
    .string()
    .max(200)
    .nullable()
    .describe("Nome do organizador / assessoria responsável."),
  description: z
    .string()
    .max(800)
    .nullable()
    .describe("Descrição curta (até 600 chars) sobre a prova."),
  routeDescription: z
    .string()
    .max(2000)
    .nullable()
    .describe("Descrição textual do percurso, ponto de partida e chegada."),
  imageUrl: z
    .string()
    .max(2048)
    .nullable()
    .describe(
      "URL absoluta da imagem principal / cartaz da prova, se identificada na página.",
    ),
});

export type RaceExtraction = z.infer<typeof raceExtractionSchema>;

/**
 * Fields that the admin form treats as "preserve user input" — if the admin
 * has already typed something into one of these, the autofill skips it.
 * Kept in sync with the schema keys.
 */
export const RACE_EXTRACTION_FIELDS: ReadonlyArray<keyof RaceExtraction> = [
  "name",
  "date",
  "startTime",
  "city",
  "state",
  "address",
  "distances",
  "registrationPrice",
  "registrationPrices",
  "registrationLink",
  "registrationDeadline",
  "prizeType",
  "prizeDetails",
  "organizer",
  "description",
  "routeDescription",
  "imageUrl",
];
