import { RaceForm } from "@/components/admin/race-form";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Nova Corrida — Admin",
};

export default async function NewRacePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;

  let cityData: { name: string; state_code: string; latitude: number; longitude: number } | undefined;
  if (params.suggestionId && params.city) {
    const supabase = await createClient();
    const { data: cities } = await supabase.rpc("search_cities", { p_query: params.city, p_limit: 10 });
    const match = cities?.find(
      (c) => c.name.toLowerCase() === params.city!.toLowerCase() && (!params.state || c.state_code === params.state)
    );
    if (match) cityData = { name: match.name, state_code: match.state_code, latitude: match.latitude, longitude: match.longitude };
  }

  const suggestionData = params.suggestionId
    ? { name: params.name ?? "", city: params.city ?? "", state: params.state ?? "", date: params.date ?? "", link: params.link ?? "", notes: params.notes ?? "", suggestionId: params.suggestionId, cityData }
    : undefined;

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Nova Corrida</h1>
      <RaceForm suggestionData={suggestionData} />
    </>
  );
}
