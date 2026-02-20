"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";

interface SuggestionActionsProps {
  suggestion: {
    id: string;
    name: string;
    city: string;
    state: string;
    date: string | null;
  };
}

export function SuggestionActions({ suggestion }: SuggestionActionsProps) {
  const router = useRouter();
  const [isRejecting, setIsRejecting] = useState(false);

  const handleReject = async () => {
    setIsRejecting(true);
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
    setIsRejecting(false);
  };

  const approveParams = new URLSearchParams({
    suggestionId: suggestion.id,
    name: suggestion.name,
    city: suggestion.city,
    ...(suggestion.state ? { state: suggestion.state } : {}),
    ...(suggestion.date ? { date: suggestion.date } : {}),
  });

  return (
    <div className="flex gap-2">
      <Button size="sm" asChild>
        <Link href={`/admin/corridas/nova?${approveParams.toString()}`}>
          Criar corrida
          <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Link>
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={handleReject}
        disabled={isRejecting}
      >
        {isRejecting && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
        Rejeitar
      </Button>
    </div>
  );
}
