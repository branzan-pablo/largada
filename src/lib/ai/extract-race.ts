import { generateObject } from "ai";
import { models, isAIEnabled } from "./provider";
import { withTelemetry } from "./observability";
import {
  raceExtractionSchema,
  type RaceExtraction,
} from "./schemas/race-extraction";
import {
  EXTRACT_RACE_SYSTEM,
  buildExtractRacePromptFromUrl,
} from "./prompts/extract-race";
import { fetchSafe, cleanHtml } from "./fetch-safe";

const IMAGE_MIME_ALLOWLIST = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);

/**
 * Extract race fields by fetching a public URL and feeding the cleaned HTML
 * to the LLM. Returns null when AI is disabled, throws on fetch / extraction
 * errors so the API route surfaces them to the admin.
 */
export async function extractRaceFromUrl(
  url: string,
): Promise<RaceExtraction | null> {
  if (!isAIEnabled()) return null;

  const fetched = await fetchSafe(url, { maxBytes: 5_000_000, timeoutMs: 15_000 });
  const cleaned = cleanHtml(fetched.text, 30_000);

  return withTelemetry(
    "extract_race_url",
    async () => {
      const { object, usage } = await generateObject({
        model: models.extract,
        schema: raceExtractionSchema,
        system: EXTRACT_RACE_SYSTEM,
        prompt: buildExtractRacePromptFromUrl({
          finalUrl: fetched.finalUrl,
          html: cleaned,
        }),
      });
      return {
        result: object,
        usage: {
          promptTokens: usage?.inputTokens,
          completionTokens: usage?.outputTokens,
          totalTokens: usage?.totalTokens,
        },
        model: "gemini-2.5-flash",
      };
    },
    { source: "url", host: new URL(url).hostname, bytes: fetched.bytes },
  );
}

/**
 * Extract race fields from a base64 image (cartaz/flyer). The provider accepts
 * the image as a multimodal input; Gemini Flash Lite supports vision at no
 * extra cost.
 */
export async function extractRaceFromImage(
  imageBase64: string,
  mimeType: string,
): Promise<RaceExtraction | null> {
  if (!isAIEnabled()) return null;

  if (!IMAGE_MIME_ALLOWLIST.has(mimeType.toLowerCase())) {
    throw new Error(`Unsupported image type: ${mimeType}`);
  }

  return withTelemetry(
    "extract_race_image",
    async () => {
      const { object, usage } = await generateObject({
        model: models.extract,
        schema: raceExtractionSchema,
        system: EXTRACT_RACE_SYSTEM,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extraia os campos da corrida deste cartaz. Não invente nada que não esteja visível.",
              },
              {
                type: "image",
                image: imageBase64,
                mediaType: mimeType,
              },
            ],
          },
        ],
      });
      return {
        result: object,
        usage: {
          promptTokens: usage?.inputTokens,
          completionTokens: usage?.outputTokens,
          totalTokens: usage?.totalTokens,
        },
        model: "gemini-2.5-flash",
      };
    },
    { source: "image", mime: mimeType, bytes: imageBase64.length },
  );
}
