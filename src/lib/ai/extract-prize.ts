import { generateObject } from "ai";
import { models, isAIEnabled } from "./provider";
import { withTelemetry } from "./observability";
import {
  prizeStructuredSchema,
  type PrizeStructured,
} from "./schemas/prize-extraction";
import {
  EXTRACT_PRIZE_SYSTEM,
  buildExtractPrizePrompt,
} from "./prompts/extract-prize";

interface ExtractPrizeInput {
  prizeType: "money" | "trophy" | "both" | "none";
  prizeDetails: string | null;
}

/**
 * Extract structured prize data from a race's free-text prize_details.
 *
 * Returns `null` when AI is disabled, the input is empty, or the call fails —
 * callers should treat null as "skip enrichment, keep the raw text".
 */
export async function extractPrizeStructured(
  input: ExtractPrizeInput,
): Promise<PrizeStructured | null> {
  if (!isAIEnabled()) return null;

  // Cheap path: prize_type=none or empty details. No need to spend a token.
  if (input.prizeType === "none" && !input.prizeDetails) {
    return {
      total_money_brl: null,
      top_n: null,
      by_category: false,
      max_per_position: null,
      has_money: false,
      has_trophy: false,
      notes: null,
    };
  }
  if (!input.prizeDetails || input.prizeDetails.trim().length < 3) {
    return {
      total_money_brl: null,
      top_n: null,
      by_category: false,
      max_per_position: null,
      has_money: input.prizeType === "money" || input.prizeType === "both",
      has_trophy: input.prizeType === "trophy" || input.prizeType === "both",
      notes: null,
    };
  }

  try {
    return await withTelemetry(
      "extract_prize",
      async () => {
        const { object, usage } = await generateObject({
          model: models.extract,
          schema: prizeStructuredSchema,
          system: EXTRACT_PRIZE_SYSTEM,
          prompt: buildExtractPrizePrompt(input),
        });
        return {
          result: object,
          usage: {
            promptTokens: usage?.inputTokens,
            completionTokens: usage?.outputTokens,
            totalTokens: usage?.totalTokens,
          },
          model: "gemini-2.0-flash-001",
        };
      },
      { prize_type: input.prizeType },
    );
  } catch (err) {
    console.error("[ai/extract-prize] Failed:", err);
    return null;
  }
}
