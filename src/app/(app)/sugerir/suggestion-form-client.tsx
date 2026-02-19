"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useLoginModal } from "@/contexts/login-modal-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CityAutocomplete } from "@/components/onboarding/city-autocomplete";
import { suggestionSchema } from "@/lib/validations";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";

export function SuggestionFormClient() {
  const { user, isLoading: authLoading } = useAuth();
  const { openLogin } = useLoginModal();
  const router = useRouter();

  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [city, setCity] = useState("");
  const [link, setLink] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      openLogin();
    }
  }, [authLoading, user, openLogin]);

  if (authLoading || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = suggestionSchema.safeParse({ name, date, city, link, notes });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]?.toString();
        if (field) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (res.status === 429) {
        toast.error("Limite de sugestões diárias atingido. Tente novamente amanhã.");
        return;
      }

      if (!res.ok) {
        toast.error("Erro ao enviar sugestão.");
        return;
      }

      toast.success("Sugestão enviada! Nossa equipe vai analisar.");
      router.push("/perfil/sugestoes");
    } catch {
      toast.error("Erro ao enviar sugestão.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome da corrida *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Corrida de São José"
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Cidade *</Label>
        <CityAutocomplete
          onSelect={(c) => setCity(c.name)}
          onClear={() => setCity("")}
          placeholder="Digite a cidade da corrida..."
        />
        {errors.city && (
          <p className="text-sm text-destructive">{errors.city}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Data (se souber)</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="link">Link (site ou rede social)</Label>
        <Input
          id="link"
          type="text"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="Ex: www.corridaxyz.com.br ou https://..."
          className={errors.link ? "border-destructive" : ""}
        />
        {errors.link ? (
          <p className="text-xs text-destructive">{errors.link}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Aceita links com ou sem https://
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Informações adicionais sobre a corrida..."
          rows={3}
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Send className="mr-2 h-4 w-4" />
        )}
        Enviar sugestão
      </Button>
    </form>
  );
}
