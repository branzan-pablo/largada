import { RaceForm } from "@/components/admin/race-form";
import { createClient } from "@/lib/supabase/server";
import {
  suggestionAnalysisSchema,
  type SuggestionAnalysis,
} from "@/lib/ai/schemas/suggestion-analysis";

export const metadata = {
  title: "Nova Corrida | Admin",
};

export default async function NewRacePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;

  let cityData:
    | { name: string; state_code: string; latitude: number; longitude: number }
    | undefined;
  let aiAnalysis: SuggestionAnalysis | null = null;

  if (params.suggestionId) {
    const supabase = await createClient();
    if (params.city) {
      const { data: cities } = await supabase.rpc("search_cities", {
        p_query: params.city,
        p_limit: 10,
      });
      const match = cities?.find(
        (c) =>
          c.name.toLowerCase() === params.city!.toLowerCase() &&
          (!params.state || c.state_code === params.state),
      );
      if (match)
        cityData = {
          name: match.name,
          state_code: match.state_code,
          latitude: match.latitude,
          longitude: match.longitude,
        };
    }

    // Pull persisted ai_analysis so the race-form can pre-fill from extracted.
    const { data: suggestion } = await supabase
      .from("race_suggestions")
      .select("ai_analysis")
      .eq("id", params.suggestionId)
      .maybeSingle();
    if (suggestion?.ai_analysis) {
      const parsed = suggestionAnalysisSchema.safeParse(suggestion.ai_analysis);
      if (parsed.success) aiAnalysis = parsed.data;
    }
  }

  const suggestionData = params.suggestionId
    ? {
        name: params.name ?? "",
        city: params.city ?? "",
        state: params.state ?? "",
        date: params.date ?? "",
        link: params.link ?? "",
        notes: params.notes ?? "",
        description: params.description ?? "",
        suggestionId: params.suggestionId,
        cityData,
        extracted: aiAnalysis?.extracted ?? undefined,
      }
    : undefined;

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Nova Corrida</h1>
      <RaceForm suggestionData={suggestionData} />
    </>
  );
}
