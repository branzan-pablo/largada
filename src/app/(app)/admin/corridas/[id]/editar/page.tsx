import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RaceForm } from "@/components/admin/race-form";
import type { Race } from "@/types/race";
import Link from "next/dist/client/link";
import { ChevronLeft } from "lucide-react";

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
    <div>
      {/* Back link */}
      <Link
        href="/admin"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Voltar para Gerenciar Corridas
      </Link>

      <h1 className="mb-6 text-2xl font-bold">Editar Corrida</h1>
      <RaceForm race={race as Race} />
    </div>
  );
}
