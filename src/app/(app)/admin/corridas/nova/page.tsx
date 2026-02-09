import { RaceForm } from "@/components/admin/race-form";

export const metadata = {
  title: "Nova Corrida — Admin",
};

export default async function NewRacePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;

  const suggestionData = params.suggestionId
    ? {
        name: params.name ?? "",
        city: params.city ?? "",
        date: params.date ?? "",
        suggestionId: params.suggestionId,
      }
    : undefined;

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Nova Corrida</h1>
      <RaceForm suggestionData={suggestionData} />
    </div>
  );
}
