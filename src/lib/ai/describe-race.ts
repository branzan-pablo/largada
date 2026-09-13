import { generateText } from "ai";
import { models, modelIds, isAIEnabled } from "./provider";
import { withTelemetry } from "./observability";
import {
  DESCRIBE_RACE_SYSTEM,
  buildDescribeRacePrompt,
  type DescribeRaceInput,
} from "./prompts/describe-race";

const MAX_CHARS = 500;

/**
 * Generate a short, neutral race description (~200-400 chars) from the
 * structured fields the admin already typed into the form. The output is the
 * raw text the admin can paste into "Descrição adicional"; the front-end
 * decides whether to apply or to confirm overwrite.
 *
 * Returns null when AI is disabled. Throws on provider errors so the API route
 * surfaces the failure mode to the admin.
 */
export async function describeRace(
  input: DescribeRaceInput,
): Promise<string | null> {
  if (!isAIEnabled()) return null;
  if (!input.name?.trim()) return null;

  return withTelemetry(
    "describe_race",
    async () => {
      const { text, usage } = await generateText({
        model: models.describe,
        system: DESCRIBE_RACE_SYSTEM,
        prompt: buildDescribeRacePrompt(input),
      });
      const trimmed = text.trim().slice(0, MAX_CHARS);
      return {
        result: trimmed,
        usage: {
          promptTokens: usage?.inputTokens,
          completionTokens: usage?.outputTokens,
          totalTokens: usage?.totalTokens,
        },
        model: modelIds.describe,
      };
    },
    { name: input.name },
  );
}
