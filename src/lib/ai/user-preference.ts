import { createAdminClient } from "@/lib/supabase/admin";
import { EMBEDDING_DIMENSIONS } from "./provider";

/**
 * Weights applied to each kind of interaction signal when building a user's
 * preference embedding. Higher weight = stronger signal of taste.
 *
 *   rsvp        — explicit intent to attend the race
 *   link_click  — opened the registration link (strong intent)
 *   race_view   — visited the race detail page (weakest)
 */
const SIGNAL_WEIGHTS = {
  rsvp: 3.0,
  link_click: 2.0,
  race_view: 1.0,
} as const;

/**
 * Maximum number of distinct races we pull per signal type when assembling the
 * preference embedding. Caps the work the cron does per user and avoids one
 * heavy user dominating the cron run.
 */
const PER_SIGNAL_LIMIT = 30;

export interface PreferenceSignal {
  race_id: string;
  embedding: number[];
  weight: number;
}

/**
 * Cosine similarity between two vectors of the same length. Returns 0 for
 * degenerate inputs (zero-norm or mismatched length) so callers never see NaN.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0;
  return dot / denom;
}

/**
 * Weighted average of a list of equally-dimensioned vectors. Each entry carries
 * its own weight (typically the SIGNAL_WEIGHTS value above). Returns null when
 * there is nothing to average — callers should fall back to the heuristic-only
 * path when this returns null.
 */
export function weightedAverage(
  vectors: { embedding: number[]; weight: number }[],
): number[] | null {
  if (vectors.length === 0) return null;
  const dim = vectors[0].embedding.length;
  if (dim !== EMBEDDING_DIMENSIONS) return null;

  const sum = new Array(dim).fill(0);
  let totalWeight = 0;
  for (const { embedding, weight } of vectors) {
    if (embedding.length !== dim || weight <= 0) continue;
    for (let i = 0; i < dim; i++) {
      sum[i] += embedding[i] * weight;
    }
    totalWeight += weight;
  }
  if (totalWeight === 0) return null;
  return sum.map((v) => v / totalWeight);
}

/**
 * Parse a pgvector string-encoded vector (e.g. "[0.1,0.2,...]") back into a
 * number[]. Supabase returns the embedding column as a string when the table
 * row is selected, so we normalize here.
 */
export function parsePgVector(raw: unknown): number[] | null {
  if (Array.isArray(raw)) return raw.map(Number);
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) return null;
  const parts = trimmed.slice(1, -1).split(",");
  const out = parts.map((p) => Number.parseFloat(p));
  if (out.some((n) => Number.isNaN(n))) return null;
  return out;
}

/**
 * Build a single 768-dim preference vector for one user by combining the races
 * they have RSVPed to, clicked through to, and viewed. Returns null when the
 * user has zero signals (cold-start) or every signal points at a race that has
 * no embedding yet (legacy rows before Sprint 1).
 *
 * Designed to be cheap enough to call per-user inside the recommendations cron.
 */
export async function getUserPreferenceEmbedding(
  userId: string,
): Promise<number[] | null> {
  const supabase = createAdminClient();

  const [rsvpResult, clickResult, viewResult] = await Promise.all([
    supabase
      .from("rsvps")
      .select("race_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(PER_SIGNAL_LIMIT),
    supabase
      .from("link_clicks")
      .select("race_id")
      .eq("user_id", userId)
      .order("clicked_at", { ascending: false })
      .limit(PER_SIGNAL_LIMIT),
    supabase
      .from("race_views")
      .select("race_id")
      .eq("user_id", userId)
      .order("viewed_at", { ascending: false })
      .limit(PER_SIGNAL_LIMIT),
  ]);

  const signalMap = new Map<string, number>();
  for (const row of rsvpResult.data ?? []) {
    signalMap.set(row.race_id, (signalMap.get(row.race_id) ?? 0) + SIGNAL_WEIGHTS.rsvp);
  }
  for (const row of clickResult.data ?? []) {
    signalMap.set(row.race_id, (signalMap.get(row.race_id) ?? 0) + SIGNAL_WEIGHTS.link_click);
  }
  for (const row of viewResult.data ?? []) {
    signalMap.set(row.race_id, (signalMap.get(row.race_id) ?? 0) + SIGNAL_WEIGHTS.race_view);
  }

  if (signalMap.size === 0) return null;

  const raceIds = Array.from(signalMap.keys());
  const { data: races } = await supabase
    .from("races")
    .select("id, embedding")
    .in("id", raceIds);

  if (!races || races.length === 0) return null;

  const vectors: { embedding: number[]; weight: number }[] = [];
  for (const race of races) {
    const embedding = parsePgVector(race.embedding);
    if (!embedding) continue;
    const weight = signalMap.get(race.id);
    if (!weight) continue;
    vectors.push({ embedding, weight });
  }

  return weightedAverage(vectors);
}
