"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";

interface SuggestionActionsProps {
  suggestion: {
    id: string;
    name: string;
    city: string;
    date: string | null;
  };
}

export function SuggestionActions({ suggestion }: SuggestionActionsProps) {
  const router = useRouter();

  const handleReject = async () => {
    const res = await fetch("/api/suggestions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: suggestion.id, status: "rejected" }),
    });

    if (res.ok) {
      toast.success("Sugestão rejeitada");
      router.refresh();
    } else {
      toast.error("Erro ao rejeitar sugestão");
    }
  };

  const approveParams = new URLSearchParams({
    suggestionId: suggestion.id,
    name: suggestion.name,
    city: suggestion.city,
    ...(suggestion.date ? { date: suggestion.date } : {}),
  });

  return (
    <div className="flex gap-2">
      <Button size="sm" asChild>
        <Link href={`/admin/corridas/nova?${approveParams.toString()}`}>
          Aprovar
        </Link>
      </Button>
      <Button size="sm" variant="outline" onClick={handleReject}>
        Rejeitar
      </Button>
    </div>
  );
}
