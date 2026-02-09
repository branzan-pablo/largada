import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RaceForm } from "@/components/admin/race-form";
import type { Race } from "@/types/race";

export const metadata = {
  title: "Editar Corrida — Admin",
};

export default async function EditRacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: race } = await supabase
    .from("races")
    .select("*")
    .eq("id", id)
    .single();

  if (!race) {
    notFound();
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Editar Corrida</h1>
      <RaceForm race={race as Race} />
    </div>
  );
}
