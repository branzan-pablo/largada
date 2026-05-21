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
  distances?: string[] | null;
}

const EMPTY_SKELETON: PrizeStructured = {
  by_distance: [],
  by_category: false,
  has_money: false,
  has_trophy: false,
  notes: null,
};

/**
 * Extract structured prize data from a race's free-text prize_details.
 *
 * Returns `null` when AI is disabled or the call fails — callers should treat
 * null as "skip enrichment, keep the raw text". The cheap-path skeletons fire
 * before any token is spent when the prize_type/details combination already
 * tells the full story.
 */
export async function extractPrizeStructured(
  input: ExtractPrizeInput,
): Promise<PrizeStructured | null> {
  if (!isAIEnabled()) return null;

  if (input.prizeType === "none" && !input.prizeDetails) {
    return EMPTY_SKELETON;
  }
  if (!input.prizeDetails || input.prizeDetails.trim().length < 3) {
    return {
      ...EMPTY_SKELETON,
      has_money: input.prizeType === "money" || input.prizeType === "both",
      has_trophy: input.prizeType === "trophy" || input.prizeType === "both",
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
          model: "gemini-2.5-flash",
        };
      },
      { prize_type: input.prizeType },
    );
  } catch (err) {
    console.error("[ai/extract-prize] Failed:", err);
    return null;
  }
}
